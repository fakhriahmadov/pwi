import Anthropic from "@anthropic-ai/sdk";
import { db, dbConfigured } from "./db";
import { REGIONS, TOPICS } from "./news";
import { slugify } from "./markdown";

/**
 * AI drafting for the daily brief. For each region × theme, Claude receives the morning's headlines, groups the
 * ones about the same event, researches the best (web search) and writes a short story in English.
 * Drafts wait in Admin → News; nothing is published without an editor.
 * Needs ANTHROPIC_API_KEY (set in Vercel). Without it, headlines are still gathered and editors write stories themselves.
 */
export const MODEL = "claude-opus-5-5";
export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM = `You are a news editor at the Private Wealth Institute, a research institute about how private wealth is created, kept and passed on. Its readers are business owners, family principals, family offices and their advisors.

Each morning you receive candidate headlines for one region and one theme. Your job:
1. Group headlines that report the same event. Ignore anything off-theme (for "unicorns": only companies newly valued at $1bn or more; not toys, films or brands named Unicorn), duplicates, opinion pieces and minor items.
2. Choose at most 2 events that matter most to owners and families: large fortunes changing, successions, family businesses, big new companies, notable failures.
3. For each chosen event, use web search to check the facts across several outlets (local-language outlets are fine). Use at most 4 searches in total.
4. Write each story and call submit_story once per story. If nothing qualifies, call nothing and say so in one line.

Writing rules:
- English (British spelling), plain and factual, in the institute's calm voice. No hype, no speculation, no advice.
- title: a clear headline, at most 14 words, no clickbait, no trailing full stop.
- body: about 150 words (between 120 and 180), two or three short paragraphs separated by a blank line. What happened, the numbers, who is involved, what it means for owners and families. Original wording: never copy sentences from sources.
- figure: the single key number with currency and unit, e.g. "+$4.2bn", "€860m", "$1.1bn valuation" shortened to "$1.1bn". Use a figure only if the sources state it; otherwise an empty string.
- takeaway: one sentence (at most 22 words) on why it matters to owners and families.
- sources: the outlets you actually relied on, with the article URLs (at least one, at most five).
- event_date: the date the news broke, YYYY-MM-DD.
- Never include private details about individuals beyond what is newsworthy and reported. If facts conflict between sources, use the most reliable and say so briefly.`;

const SUBMIT_STORY: Anthropic.Beta.BetaTool = {
  name: "submit_story",
  description: "Submit one finished story for the editor to review. Call once per story.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["headline_ids", "title", "figure", "takeaway", "body", "sources", "event_date"],
    properties: {
      headline_ids: { type: "array", items: { type: "string" }, description: "Ids of the candidate headlines this story covers." },
      title: { type: "string" },
      figure: { type: "string", description: "Key number, or an empty string." },
      takeaway: { type: "string" },
      body: { type: "string" },
      sources: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "url"], properties: { name: { type: "string" }, url: { type: "string" } } } },
      event_date: { type: "string", description: "YYYY-MM-DD" },
    },
  },
};

type Draft = { headline_ids: string[]; title: string; figure: string; takeaway: string; body: string; sources: { name: string; url: string }[]; event_date: string };
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** A draft we can show the editor, or the reason it was rejected. */
function check(d: Draft): string | null {
  if (!d.title?.trim() || d.title.length > 160) return "title";
  const n = words(d.body || "");
  if (n < 80 || n > 260) return `body has ${n} words`;
  if (!Array.isArray(d.sources) || !d.sources.some((s) => /^https?:\/\//.test(s.url))) return "no source link";
  return null;
}

async function uniqueSlug(title: string, date: string) {
  const base = slugify(`${title}`).slice(0, 80) || "story";
  let slug = base, i = 2;
  while (await db.newsStory.findUnique({ where: { slug } })) slug = `${base}-${i++}`;
  return `${slug}`.replace(/-+$/, "") || `story-${date}`;
}

/** Drafts stories for one region × theme from its unused headlines. Returns how many drafts were saved. */
async function draftBatch(client: Anthropic, region: (typeof REGIONS)[number], topic: (typeof TOPICS)[number]) {
  const since = new Date(Date.now() - 3 * 864e5);
  const heads = await db.newsItem.findMany({ where: { region: region.key, topic: topic.key, status: "candidate", storyId: null, createdAt: { gte: since } }, orderBy: { publishedAt: "desc" }, take: 12 });
  if (!heads.length) return { saved: 0, rejected: 0 };
  const list = heads.map((h) => `- id ${h.id} · ${h.publishedAt.toISOString().slice(0, 10)} · ${h.source || "unknown outlet"} · ${h.title}\n  ${h.url}`).join("\n");
  const messages: Anthropic.Beta.BetaMessageParam[] = [{
    role: "user",
    content: `Region: ${region.label}. Theme: ${topic.label}. Today: ${new Date().toISOString().slice(0, 10)}.\n\nCandidate headlines:\n${list}`,
  }];
  const drafts: Draft[] = [];
  for (let turn = 0; turn < 6; turn++) {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: SYSTEM,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }, SUBMIT_STORY],
      messages,
    });
    if (res.stop_reason === "refusal") { console.warn(`[news-ai] ${region.key}/${topic.key}: declined (${res.stop_details?.category ?? "no category"})`); break; }
    messages.push({ role: "assistant", content: res.content });
    if (res.stop_reason === "pause_turn") continue; // the server resumes its web searches
    const calls = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === "submit_story");
    if (!calls.length) break;
    for (const c of calls) drafts.push(c.input as Draft);
    messages.push({ role: "user", content: calls.map((c) => ({ type: "tool_result" as const, tool_use_id: c.id, content: "Saved for the editor." })) });
    if (res.stop_reason !== "tool_use") break;
  }
  let saved = 0, rejected = 0;
  for (const d of drafts.slice(0, 3)) {
    const why = check(d);
    if (why) { rejected++; console.warn(`[news-ai] ${region.key}/${topic.key}: draft rejected (${why})`); continue; }
    const ids = (d.headline_ids || []).filter((id) => heads.some((h) => h.id === id));
    const date = /^\d{4}-\d{2}-\d{2}$/.test(d.event_date) ? d.event_date : new Date().toISOString().slice(0, 10);
    const story = await db.newsStory.create({
      data: {
        slug: await uniqueSlug(d.title, date), region: region.key, topic: topic.key, title: d.title.trim().replace(/\.$/, ""),
        figure: d.figure?.trim() || null, takeaway: d.takeaway?.trim() || null, body: d.body.trim(),
        sources: d.sources.filter((s) => /^https?:\/\//.test(s.url)).slice(0, 5), eventDate: new Date(`${date}T12:00:00Z`), aiDrafted: true,
      },
    });
    if (ids.length) await db.newsItem.updateMany({ where: { id: { in: ids } }, data: { storyId: story.id } });
    saved++;
  }
  // Headlines looked at but not used stay in the list for editors; mark them so they aren't drafted again tomorrow.
  await db.newsItem.updateMany({ where: { id: { in: heads.map((h) => h.id) }, storyId: null }, data: { status: "reviewed" } });
  return { saved, rejected };
}

/** Drafts stories for every region × theme with fresh headlines (a few at a time). */
export async function draftStories(opts: { region?: string } = {}) {
  if (!dbConfigured() || !aiConfigured()) return { drafted: 0, rejected: 0, failed: 0, skipped: true };
  const client = new Anthropic();
  const jobs = TOPICS.flatMap((t) => REGIONS.filter((r) => !opts.region || r.key === opts.region).map((r) => ({ r, t })));
  let drafted = 0, rejected = 0, failed = 0, next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const { r, t } = jobs[next++];
      try { const out = await draftBatch(client, r, t); drafted += out.saved; rejected += out.rejected; }
      catch (e) {
        failed++;
        if (e instanceof Anthropic.AuthenticationError) console.error("[news-ai] the Anthropic API key was refused");
        else if (e instanceof Anthropic.RateLimitError) console.error("[news-ai] rate limited");
        else if (e instanceof Anthropic.APIError) console.error(`[news-ai] API error ${e.status}: ${e.message}`);
        else console.error("[news-ai]", e);
      }
    }
  };
  await Promise.all(Array.from({ length: 5 }, worker));
  return { drafted, rejected, failed, skipped: false };
}
