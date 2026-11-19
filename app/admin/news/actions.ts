"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { gatherNews, REGIONS, TOPICS } from "@/lib/news";
import { draftStories, aiConfigured, BUDGETS, compareModels } from "@/lib/news-ai";
import { slugify } from "@/lib/markdown";

async function admin() {
  const me = await currentUser().catch(() => null);
  if (!me || me.role !== "admin") redirect("/admin/login");
  return me!;
}
const back = (fd: FormData, msg: string): never => redirect(`/admin/news?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(String(fd.get("qs") || ""))), msg })}`);
const refresh = (slug?: string) => { revalidatePath("/"); revalidatePath("/news"); if (slug) revalidatePath(`/news/${slug}`); };

/** Sources typed one per line as "Name | https://…" (or just the link). */
function parseSources(text: string) {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const [a, b] = l.includes("|") ? l.split("|").map((x) => x.trim()) : ["", l];
    return { name: a || (() => { try { return new URL(b).hostname.replace(/^www\./, ""); } catch { return b; } })(), url: b };
  }).filter((s) => /^https?:\/\//.test(s.url)).slice(0, 8);
}
function fields(fd: FormData) {
  const s = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  const topic = s("topic", 40), region = s("region", 40), date = s("eventDate", 10);
  return {
    title: s("title", 200).replace(/\.$/, ""), figure: s("figure", 40) || null, takeaway: s("takeaway", 300) || null, body: s("body", 4000),
    sources: parseSources(String(fd.get("sources") ?? "")),
    ...(TOPICS.some((t) => t.key === topic) ? { topic } : {}), ...(REGIONS.some((r) => r.key === region) ? { region } : {}),
    ...(/^\d{4}-\d{2}-\d{2}$/.test(date) ? { eventDate: new Date(`${date}T12:00:00Z`) } : {}),
  };
}

async function storyAction(fd: FormData, act: "publish" | "save" | "dismiss" | "restore") {
  const me = await admin();
  const id = String(fd.get("id") || "");
  const f = fields(fd);
  if (act === "publish" || act === "save") {
    if (!f.title) back(fd, "The headline can’t be empty.");
    if (!f.body) back(fd, "The story text can’t be empty.");
  }
  const s = await db.newsStory.update({
    where: { id },
    data: act === "publish" ? { ...f, status: "published", approvedAt: new Date(), approvedBy: me.email }
      : act === "save" ? f
      : act === "dismiss" ? { status: "dismissed" }
      : { status: "draft", approvedAt: null },
  });
  refresh(s.slug);
  back(fd, act === "publish" ? "Published — it’s on the homepage and in All news." : act === "dismiss" ? "Dismissed." : act === "restore" ? "Moved back to drafts." : "Saved.");
}
export async function publishStory(fd: FormData) { await storyAction(fd, "publish"); }
export async function saveStory(fd: FormData) { await storyAction(fd, "save"); }
export async function dismissStory(fd: FormData) { await storyAction(fd, "dismiss"); }
export async function restoreStory(fd: FormData) { await storyAction(fd, "restore"); }

/** An editor writes a story by hand (no AI needed). It starts as a draft. */
export async function createStory(fd: FormData) {
  await admin();
  const f = fields(fd);
  if (!f.title || !f.body) back(fd, "Please add at least a headline and the story text.");
  const base = slugify(f.title).slice(0, 80) || "story";
  let slug = base, i = 2;
  while (await db.newsStory.findUnique({ where: { slug } })) slug = `${base}-${i++}`;
  await db.newsStory.create({ data: { slug, region: f.region ?? "europe", topic: f.topic ?? "billionaires", title: f.title, figure: f.figure, takeaway: f.takeaway, body: f.body, sources: f.sources, eventDate: f.eventDate ?? new Date() } });
  back(fd, "Draft saved. Review it below and publish when ready.");
}

/** Gather headlines now, then have AI draft stories from them. */
export async function fetchNow(fd: FormData) {
  await admin();
  const g = await gatherNews();
  if (g.failed === g.feeds) back(fd, "Couldn’t reach the news feeds just now. Please try again in a minute.");
  if (!aiConfigured()) back(fd, `${g.added} new headlines gathered. Add ANTHROPIC_API_KEY in Vercel to have stories drafted automatically — until then, write them under “Write a story”.`);
  const d = await draftStories();
  const money = `AI spend today $${d.spent.toFixed(2)} of $${d.budget.toFixed(2)}`;
  back(fd, `${g.added} new headlines gathered · ${d.drafted} ${d.drafted === 1 ? "story" : "stories"} drafted${d.failed ? ` · ${d.failed} regions failed (see the logs)` : ""} · ${money}${d.budgetReached ? " — today’s budget is reached, so drafting stopped. It starts again tomorrow, or raise the budget below." : "."}`);
}

/** One-off: draft one region with Haiku and with Opus from the same headlines, to compare quality. */
export async function runComparison(fd: FormData) {
  await admin();
  if (!aiConfigured()) back(fd, "Add ANTHROPIC_API_KEY in Vercel first.");
  const region = String(fd.get("region") || "");
  let t = await compareModels(region);
  if (!t) {
    await gatherNews();
    t = await compareModels(region);
  }
  if (!t) back(fd, "No fresh headlines for that region right now. Try another region.");
  redirect(`/admin/news?view=compare&msg=${encodeURIComponent("Comparison ready — both versions are shown below. Nothing was saved as a story.")}`);
}

/** Change the daily AI budget for news drafting. */
export async function setBudget(fd: FormData) {
  await admin();
  const v = Number(fd.get("budget"));
  if (!BUDGETS.includes(v)) back(fd, "Please choose one of the budgets in the list.");
  await db.newsSetting.upsert({ where: { id: "news" }, create: { id: "news", dailyBudgetUsd: v }, update: { dailyBudgetUsd: v } });
  back(fd, `Daily AI budget set to $${v.toFixed(2)}.`);
}
