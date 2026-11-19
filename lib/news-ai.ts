import Anthropic from "@anthropic-ai/sdk";
import { db, dbConfigured } from "./db";
import { REGIONS, TOPICS } from "./news";
import { slugify } from "./markdown";

/**
 * AI drafting for the daily brief. Once a day, for each region, Claude receives the morning's headlines for all three
 * themes, picks at most one event per theme (up to 3 stories), checks them with web search and writes short stories in English.
 * Drafts wait in Admin → News; nothing is published without an editor.
 * Needs ANTHROPIC_API_KEY (set in Vercel). Without it, headlines are still gathered and editors write stories themselves.
 *
 * Cost: Claude Haiku 5.5 at low effort; one web search per region on a $0.10 budget, one per story from $0.20.
 * Every call's real cost is recorded per UTC day and drafting stops before the daily budget (set in Admin → News,
 * default $0.10) would be passed — the cron run and "Fetch and draft now" share the same budget.
 */
export const MODEL = "claude-haiku-5-5";
const PRICE = { inSmall: 0.1, outSmall: 0.5, inLarge: 0.5, outLarge: 2.5, search: 0.01 }; // $ per 1M tokens (≤100K / >100K prompt) and per search
export const BUDGETS = [0.1, 0.2, 0.5];
/** Today's budget: set in Admin → News (default $0.10). */
export async function dailyBudget() {
  const row = dbConfigured() ? await db.newsSetting.findUnique({ where: { id: "news" } }).catch(() => null) : null;
  return row?.dailyBudgetUsd ?? 0.1;
}
/** Web searches per region: one fact check per story when the budget allows. */
const searchesFor = (budget: number) => (budget >= 0.5 ? 3 : budget >= 0.2 ? 2 : 1);
/** The most one region's call should cost; a call that could pass the budget is never started. */
const reserveFor = (searches: number) => 0.015 + searches * PRICE.search;
const today = () => new Date().toISOString().slice(0, 10);
export async function spentToday() {
  if (!dbConfigured()) return 0;
  return (await db.aiSpend.findUnique({ where: { day: today() } }).catch(() => null))?.usd ?? 0;
}
/** The previous, stronger model — used only by the one-off comparison in Admin → News. */
export const COMPARE_MODEL = "claude-opus-5-5";
function costOf(u: Anthropic.Beta.BetaUsage, model = MODEL) {
  const input = (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) * 1.25 + (u.cache_read_input_tokens ?? 0) * 0.1;
  const large = input > 100_000;
  const [rin, rout] = model === COMPARE_MODEL ? [4, 20] : large ? [PRICE.inLarge, PRICE.outLarge] : [PRICE.inSmall, PRICE.outSmall];
  const searches = u.server_tool_use?.web_search_requests ?? 0;
  return (input * rin + (u.output_tokens ?? 0) * rout) / 1e6 + searches * PRICE.search;
}
async function record(usd: number) {
  await db.aiSpend.upsert({ where: { day: today() }, create: { day: today(), usd, calls: 1 }, update: { usd: { increment: usd }, calls: { increment: 1 } } });
}
export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM = `You are a news editor at the Private Wealth Institute, a research institute about how private wealth is created, kept and passed on. Its readers are business owners, family principals, family offices and their advisors.

Each morning you receive candidate headlines for one region, grouped by theme: fortunes (billionaires and large family wealth), unicorns (companies newly valued at $1bn or more) and bankruptcies (notable failures, especially of family-owned or founder-led businesses). Your job:
1. Group headlines that report the same event. Ignore anything off-theme (for unicorns: not toys, films or brands named Unicorn), duplicates, opinion pieces and minor items.
2. Choose at most ONE event per theme that matters most to owners and families — up to 3 stories in total, one per theme. Skip a theme when nothing worthwhile happened.
3. Fact-checking: {SEARCHES}. Otherwise rely on the headlines and the outlets named.
4. Write all your stories, then call submit_story once per story — all calls together in the same reply. If nothing qualifies, call nothing and say so in one line.

Writing rules:
- English (British spelling), plain and factual, in the institute's calm voice. No hype, no speculation, no advice.
- Write as the institute, for readers. Never mention yourself, your research or your sources' wording: no "I", "we reviewed", "the reports I saw", "according to my search". Just state the facts and name the outlet when attribution matters ("according to the BBC").
- title: a clear headline, at most 14 words, no clickbait, no trailing full stop.
- body: about 150 words (between 120 and 180), two or three short paragraphs separated by a blank line. What happened, the numbers, who is involved, what it means for owners and families. Original wording: never copy sentences from sources.
- Be concrete: include the date of the event (e.g. "on 18 November") and the most important specific facts the sources give — amounts, jobs or people affected, the year a business was founded, earlier rulings or deals. Prefer one precise fact over a general sentence.
- figure: the single key number with currency and unit, e.g. "+$4.2bn", "€860m", "$1.1bn valuation" shortened to "$1.1bn", "95 jobs". It must be an amount of money, a valuation, a stake or a number of jobs or people affected — never an age, a number of years, a date or a rank. Use a figure only if a headline or a search result you saw states it exactly; otherwise an empty string. When unsure, leave it empty.
- Numbers: never state a number, amount, percentage, rank or date in the title, body or takeaway unless a headline or a search result you saw shows it. Do not estimate, round up, convert currencies or fill gaps from memory. If a detail is not in what you saw, leave it out rather than guess.
- takeaway: one sentence (at most 22 words) on why it matters to owners and families.
- sources: the outlets you actually relied on, with the article URLs (at least one, at most five). Use each outlet's own article link, not a news.google.com redirect link, whenever you have it; name the outlet itself (e.g. "The Independent"), not the aggregator.
- event_date: the date the news broke, YYYY-MM-DD.
- topic: "billionaires", "unicorns" or "bankruptcies".
- Never include private details about individuals beyond what is newsworthy and reported. If facts conflict between sources, use the most reliable and say so briefly.`;

const SUBMIT_STORY: Anthropic.Beta.BetaTool = {
  name: "submit_story",
  description: "Submit one finished story for the editor to review. Call once per story.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["headline_ids", "topic", "title", "figure", "takeaway", "body", "sources", "event_date"],
    properties: {
      headline_ids: { type: "array", items: { type: "string" }, description: "Ids of the candidate headlines this story covers." },
      topic: { type: "string", enum: ["billionaires", "unicorns", "bankruptcies"] },
      title: { type: "string" },
      figure: { type: "string", description: "Key number, or an empty string." },
      takeaway: { type: "string" },
      body: { type: "string" },
      sources: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "url"], properties: { name: { type: "string" }, url: { type: "string" } } } },
      event_date: { type: "string", description: "YYYY-MM-DD" },
    },
  },
};

type Draft = { headline_ids: string[]; topic: string; title: string; figure: string; takeaway: string; body: string; sources: { name: string; url: string }[]; event_date: string };
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

type Head = { id: string; topic: string; title: string; source: string | null; url: string; publishedAt: Date };
const searchText = (n: number) => n === 1 ? "you may run ONE web search in total, for your most important story" : n === 2 ? "you may run up to 2 web searches in total, for your two most important stories" : "you may run up to 3 web searches in total, one per story";

async function headlinesFor(region: (typeof REGIONS)[number]) {
  const since = new Date(Date.now() - 3 * 864e5);
  return (await Promise.all(TOPICS.map((t) => db.newsItem.findMany({ where: { region: region.key, topic: t.key, status: "candidate", storyId: null, createdAt: { gte: since } }, orderBy: { publishedAt: "desc" }, take: 8 })))).flat();
}

/** One model call for one region: returns the submitted drafts, what it cost and how many searches ran. */
async function askModel(client: Anthropic, model: string, region: (typeof REGIONS)[number], heads: Head[], searches: number, recordSpend: boolean) {
  const list = TOPICS.map((t) => {
    const hs = heads.filter((h) => h.topic === t.key);
    return hs.length ? `Theme: ${t.key}\n` + hs.map((h) => `- id ${h.id} · ${h.publishedAt.toISOString().slice(0, 10)} · ${h.source || "unknown outlet"} · ${h.title}\n  ${h.url}`).join("\n") : "";
  }).filter(Boolean).join("\n\n");
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: `Region: ${region.label}. Today: ${today()}.\n\nCandidate headlines:\n${list}` }];
  const drafts: Draft[] = [];
  let usd = 0, searched = 0;
  for (let turn = 0; turn < 3; turn++) {
    const res = await client.beta.messages.create({
      model,
      max_tokens: 8000,
      output_config: { effort: model === COMPARE_MODEL ? "medium" : "low" }, // Opus as it ran before; Haiku kept lean
      system: SYSTEM.replace("{SEARCHES}", searchText(searches)),
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: searches }, SUBMIT_STORY],
      messages,
    });
    const c = costOf(res.usage, model); usd += c; if (recordSpend) await record(c);
    searched += res.usage.server_tool_use?.web_search_requests ?? 0;
    if (res.stop_reason === "refusal") { console.warn(`[news-ai] ${region.key}: declined (${res.stop_details?.category ?? "no category"})`); break; }
    messages.push({ role: "assistant", content: res.content });
    if (res.stop_reason === "pause_turn") continue; // the server resumes its web search
    for (const b of res.content) if (b.type === "tool_use" && b.name === "submit_story") drafts.push(b.input as Draft);
    break; // all stories arrive in one reply; another turn would only cost more
  }
  for (const d of drafts) {
    // Prefer each outlet's own link: drop Google News redirect links when a direct link is there too.
    if (Array.isArray(d.sources)) {
      const direct = d.sources.filter((x) => !/^https?:\/\/news\.google\.com\//.test(x.url));
      if (direct.length) d.sources = direct;
      d.sources = d.sources.map((x) => ({ ...x, name: x.name.replace(/\s*\((?:via\s+)?Google News\)|\s+via\s+Google News/i, "").trim() }));
    }
    // A key figure is money, a stake or people affected — never an age, a span of years, a date or a rank.
    if (/\b(?:years?|yrs?|year-old|months?|days?|th|st|nd|rd|place|rank)\b|\d(?:st|nd|rd|th)\b|^\s*(?:19|20)\d{2}\s*$|^#/i.test(d.figure ?? "")) d.figure = "";
    // A key figure must be traceable: without any search, its number has to appear in one of the story's headlines.
    if (!d.figure?.trim() || searched > 0) continue;
    const titles = heads.filter((h) => d.headline_ids?.includes(h.id)).map((h) => h.title).join(" ").replace(/,/g, ".");
    const nums = d.figure.replace(/,/g, ".").match(/\d+(?:\.\d+)?/g) ?? [];
    if (!nums.length || nums.some((n) => !titles.includes(n))) d.figure = "";
  }
  return { drafts: drafts.slice(0, 3), usd, searched };
}

/** Drafts up to 3 stories (one per theme) for one region from its unused headlines, in one call. */
async function draftRegion(client: Anthropic, region: (typeof REGIONS)[number], searches: number) {
  const heads = await headlinesFor(region);
  if (!heads.length) return { saved: 0, rejected: 0, usd: 0 };
  const { drafts, usd } = await askModel(client, MODEL, region, heads, searches, true);
  let saved = 0, rejected = 0;
  for (const d of drafts) {
    const why = check(d);
    if (why) { rejected++; console.warn(`[news-ai] ${region.key}: draft rejected (${why})`); continue; }
    const topic = TOPICS.some((t) => t.key === d.topic) ? d.topic : (heads.find((h) => d.headline_ids?.includes(h.id))?.topic ?? "billionaires");
    const ids = (d.headline_ids || []).filter((id) => heads.some((h) => h.id === id));
    const date = /^\d{4}-\d{2}-\d{2}$/.test(d.event_date) ? d.event_date : new Date().toISOString().slice(0, 10);
    const story = await db.newsStory.create({
      data: {
        slug: await uniqueSlug(d.title, date), region: region.key, topic, title: d.title.trim().replace(/\.$/, ""),
        figure: d.figure?.trim() || null, takeaway: d.takeaway?.trim() || null, body: d.body.trim(),
        sources: d.sources.filter((s) => /^https?:\/\//.test(s.url)).slice(0, 5), eventDate: new Date(`${date}T12:00:00Z`), aiDrafted: true,
      },
    });
    if (ids.length) await db.newsItem.updateMany({ where: { id: { in: ids } }, data: { storyId: story.id } });
    saved++;
  }
  // Headlines looked at but not used stay in the list for editors; mark them so they aren't drafted again tomorrow.
  await db.newsItem.updateMany({ where: { id: { in: heads.map((h) => h.id) }, storyId: null }, data: { status: "reviewed" } });
  return { saved, rejected, usd };
}

/** Drafts stories region by region, one call each, stopping before the daily budget would be passed. */
export async function draftStories(opts: { region?: string } = {}) {
  if (!dbConfigured() || !aiConfigured()) return { drafted: 0, rejected: 0, failed: 0, skipped: true, budgetReached: false, spent: 0, budget: 0 };
  const client = new Anthropic();
  const budget = await dailyBudget();
  const searches = searchesFor(budget);
  let drafted = 0, rejected = 0, failed = 0, budgetReached = false;
  for (const r of REGIONS.filter((x) => !opts.region || x.key === opts.region)) {
    if ((await spentToday()) + reserveFor(searches) > budget) { budgetReached = true; console.warn(`[news-ai] daily budget of $${budget} reached; stopping`); break; }
    try { const out = await draftRegion(client, r, searches); drafted += out.saved; rejected += out.rejected; }
    catch (e) {
      failed++;
      if (e instanceof Anthropic.AuthenticationError) console.error("[news-ai] the Anthropic API key was refused");
      else if (e instanceof Anthropic.RateLimitError) console.error("[news-ai] rate limited");
      else if (e instanceof Anthropic.APIError) console.error(`[news-ai] API error ${e.status}: ${e.message}`);
      else console.error("[news-ai]", e);
    }
  }
  return { drafted, rejected, failed, skipped: false, budgetReached, spent: await spentToday(), budget };
}

export type TrialSide = { model: string; usd: number; searched: number; seconds: number; error?: string; drafts: (Draft & { rejected?: string })[] };
/** Drafts one region with Claude Haiku 5.5 and with Claude Opus 5.5 from the same headlines, for the editor to compare.
 *  Nothing is saved as a story and the headlines stay unused; the cost does not count towards the daily budget. */
export async function compareModels(regionKey: string) {
  const region = REGIONS.find((r) => r.key === regionKey) ?? REGIONS[0];
  const heads = await headlinesFor(region);
  if (!heads.length) return null;
  const client = new Anthropic();
  const searches = searchesFor(await dailyBudget());
  const run = async (model: string): Promise<TrialSide> => {
    const t0 = Date.now();
    try {
      const out = await askModel(client, model, region, heads, searches, false);
      return { model, usd: out.usd, searched: out.searched, seconds: Math.round((Date.now() - t0) / 1000), drafts: out.drafts.map((d) => ({ ...d, rejected: check(d) ?? undefined })) };
    } catch (e) {
      return { model, usd: 0, searched: 0, seconds: Math.round((Date.now() - t0) / 1000), drafts: [], error: e instanceof Anthropic.APIError ? `API error ${e.status}: ${e.message}` : String(e) };
    }
  };
  const sides = await Promise.all([run(MODEL), run(COMPARE_MODEL)]);
  return db.newsTrial.create({ data: { region: region.key, searches, result: sides as unknown as object } });
}
