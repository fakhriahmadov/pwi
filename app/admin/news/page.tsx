import Link from "next/link";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { REGIONS, TOPICS, regionLabel, topicLabel } from "@/lib/news";
import { aiConfigured, dailyBudget, spentToday, BUDGETS } from "@/lib/news-ai";
import { AdminNav } from "../AdminNav";
import { publishStory, saveStory, dismissStory, restoreStory, createStory, fetchNow, setBudget } from "./actions";
import { Select } from "@/components/Select";

export const metadata: Metadata = { title: "Admin — News", robots: { index: false } };
export const dynamic = "force-dynamic";
export const maxDuration = 300; // "Fetch and draft now" runs the AI drafting

const TABS = [["draft", "Drafts"], ["published", "Published"], ["dismissed", "Dismissed"], ["headlines", "Headlines"]] as const;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const srcText = (v: unknown) => (Array.isArray(v) ? (v as { name: string; url: string }[]).map((s) => `${s.name} | ${s.url}`).join("\n") : "");
const regionOpts = REGIONS.map((r) => ({ value: r.key, label: r.label }));
const topicOpts = TOPICS.map((t) => ({ value: t.key, label: t.label }));

function StoryFields({ s }: { s?: { id: string; title: string; figure: string | null; takeaway: string | null; body: string; sources: unknown; region: string; topic: string; eventDate: Date } }) {
  const k = s?.id ?? "new";
  return (
    <>
      <div className="field"><label htmlFor={`t-${k}`}>Headline</label><input id={`t-${k}`} name="title" className="input" defaultValue={s?.title} required /></div>
      <div className="row" style={{ ["--g" as string]: "12px" }}>
        <div className="field" style={{ flex: "1 1 140px" }}><label htmlFor={`f-${k}`}>Key figure</label><input id={`f-${k}`} name="figure" className="input" defaultValue={s?.figure ?? ""} placeholder="+$4.2bn" /></div>
        <div className="field" style={{ flex: "3 1 320px" }}><label htmlFor={`k-${k}`}>Why it matters (one line)</label><input id={`k-${k}`} name="takeaway" className="input" defaultValue={s?.takeaway ?? ""} /></div>
      </div>
      <div className="field"><label htmlFor={`b-${k}`}>Story (about 150 words; a blank line starts a new paragraph){s ? ` — ${words(s.body)} words` : ""}</label>
        <textarea id={`b-${k}`} name="body" className="input" rows={11} defaultValue={s?.body} style={{ minHeight: 250 }} /></div>
      <div className="field"><label htmlFor={`s-${k}`}>Sources, one per line: Name | link</label>
        <textarea id={`s-${k}`} name="sources" className="input" rows={3} defaultValue={srcText(s?.sources)} placeholder="Financial Times | https://www.ft.com/…" style={{ minHeight: 80, fontSize: 13 }} /></div>
      <div className="row" style={{ ["--g" as string]: "12px" }}>
        <div className="field" style={{ flex: "1 1 180px" }}><label htmlFor={`r-${k}`}>Region</label><Select id={`r-${k}`} name="region" defaultValue={s?.region ?? "europe"} options={regionOpts} /></div>
        <div className="field" style={{ flex: "1 1 180px" }}><label htmlFor={`p-${k}`}>Theme (not shown on the site)</label><Select id={`p-${k}`} name="topic" defaultValue={s?.topic ?? "billionaires"} options={topicOpts} /></div>
        <div className="field" style={{ flex: "1 1 160px" }}><label htmlFor={`d-${k}`}>Date of the news</label><input id={`d-${k}`} name="eventDate" type="date" className="input" defaultValue={iso(s?.eventDate ?? new Date())} /></div>
      </div>
    </>
  );
}

export default async function AdminNews({ searchParams }: { searchParams: Promise<{ tab?: string; region?: string; msg?: string }> }) {
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : "draft";
  const region = REGIONS.some((r) => r.key === sp.region) ? sp.region : undefined;
  const ok = dbConfigured();
  const [stories, heads, counts] = ok ? await Promise.all([
    tab === "headlines" ? Promise.resolve([]) : db.newsStory.findMany({ where: { status: tab, ...(region ? { region } : {}) }, orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }], take: 80 }),
    tab === "headlines" ? db.newsItem.findMany({ where: { ...(region ? { region } : {}), createdAt: { gte: new Date(Date.now() - 4 * 864e5) } }, orderBy: { publishedAt: "desc" }, take: 150 }) : Promise.resolve([]),
    db.newsStory.groupBy({ by: ["status"], _count: true }),
  ]) : [[], [], []];
  const count = (k: string) => counts.find((c) => c.status === k)?._count ?? 0;
  const [spent, budget] = ok ? await Promise.all([spentToday(), dailyBudget()]) : [0, 0.1];
  const qs = new URLSearchParams({ tab, ...(region ? { region } : {}) }).toString();
  const link = (p: Record<string, string | undefined>) => `/admin/news?${new URLSearchParams(Object.entries({ tab, region, ...p }).filter(([, v]) => v) as [string, string][])}`;
  const chip = (on: boolean) => ({ className: "chip", "aria-current": on ? ("page" as const) : undefined });

  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "20px", paddingTop: 40, maxWidth: 1100 }}>
        <div className="row between" style={{ alignItems: "flex-end", ["--g" as string]: "12px 24px" }}>
          <div className="stack" style={{ ["--g" as string]: "6px" }}>
            <h1 className="h2">News<span className="dot">.</span></h1>
            <p className="muted" style={{ maxWidth: "72ch" }}>Every morning headlines are gathered for each region and theme, and AI drafts short stories from several sources. Read each draft, correct anything, and publish — only published stories appear on the site.</p>
          </div>
          <form action={fetchNow}><input type="hidden" name="qs" value={qs} /><button className="btn btn-dark">Fetch and draft now</button></form>
        </div>
        <AdminNav current="news" />
        {sp.msg && <p className="notice okay" role="status">{sp.msg}</p>}
        {ok && !aiConfigured() && <p className="notice">AI drafting is off: add <b>ANTHROPIC_API_KEY</b> in Vercel → Settings → Environment Variables, then redeploy. Headlines are still gathered (see the Headlines tab) and you can write stories yourself.</p>}
        {ok && aiConfigured() && (
          <form action={setBudget} className="news-budget">
            <input type="hidden" name="qs" value={qs} />
            <div className="news-budget-t">
              <b>AI drafting today: ${spent.toFixed(2)} of ${budget.toFixed(2)}</b>
              <span className="news-budget-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (spent / budget) * 100)}%` }} /></span>
              <span className="muted">Up to 3 stories per region each morning (one per theme), {budget >= 0.5 ? "each checked with a web search" : budget >= 0.2 ? "with 2 fact-check searches per region" : "with 1 fact-check search per region"}. “Fetch and draft now” counts towards the same daily limit; drafting stops before it is passed.</span>
            </div>
            <div className="news-budget-f">
              <label htmlFor="budget" className="label-s">Daily budget</label>
              <Select id="budget" name="budget" defaultValue={String(budget)} options={BUDGETS.map((b) => ({ value: String(b), label: `$${b.toFixed(2)} a day` }))} />
              <button className="btn btn-ghost">Save</button>
            </div>
          </form>
        )}

        <details className="news-edit" style={{ borderLeftColor: "var(--ink)" }}>
          <summary style={{ cursor: "pointer", fontWeight: 500 }}>Write a story</summary>
          <form action={createStory} className="stack" style={{ ["--g" as string]: "12px", marginTop: 12 }}>
            <input type="hidden" name="qs" value={qs} />
            <StoryFields />
            <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn btn-dark">Save as draft</button></div>
          </form>
        </details>

        <div className="stack" style={{ ["--g" as string]: "10px" }}>
          <nav className="row" aria-label="Status" style={{ ["--g" as string]: "6px" }}>
            {TABS.map(([k, l]) => <Link key={k} {...chip(tab === k)} href={link({ tab: k })}>{l}{k !== "headlines" ? ` · ${count(k)}` : ""}</Link>)}
          </nav>
          <nav className="row" aria-label="Region" style={{ ["--g" as string]: "6px" }}>
            <Link {...chip(!region)} href={link({ region: undefined })}>All regions</Link>
            {REGIONS.map((r) => <Link key={r.key} {...chip(region === r.key)} href={link({ region: r.key })}>{r.label}</Link>)}
          </nav>
        </div>

        {tab === "headlines" ? (
          <div className="table-box" style={{ background: "var(--paper)" }}>
            <table className="table" style={{ fontSize: 14 }}>
              <thead><tr><th>Headline</th><th>Region · theme</th><th>Used in</th></tr></thead>
              <tbody>
                {heads.map((h) => (
                  <tr key={h.id}><td><a href={h.url} target="_blank" rel="noopener">{h.title}</a><br /><span className="muted" style={{ fontSize: 12 }}>{h.source} · {iso(h.publishedAt)}</span></td>
                    <td style={{ whiteSpace: "nowrap" }}>{regionLabel(h.region)} · {topicLabel(h.topic)}</td><td>{h.storyId ? "A story" : <span className="muted">—</span>}</td></tr>
                ))}
                {!heads.length && <tr><td colSpan={3} className="muted">No headlines in the last four days.</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="stack" style={{ ["--g" as string]: "14px" }}>
            {!stories.length && <p className="muted" style={{ padding: "24px 0" }}>{tab === "draft" ? "No drafts waiting. New ones arrive every morning — or use Fetch and draft now." : "Nothing here yet."}</p>}
            {stories.map((s) => (
              <form key={s.id} action={saveStory} className="news-edit">
                <input type="hidden" name="id" value={s.id} /><input type="hidden" name="qs" value={qs} />
                <div className="row between" style={{ alignItems: "center", ["--g" as string]: "6px 16px", fontSize: 13 }}>
                  <span className="muted">{s.aiDrafted ? "Drafted by AI" : "Written by an editor"} · {iso(s.createdAt)}{s.status === "published" && <> · <a href={`/news/${s.slug}`} target="_blank">View on the site ↗</a></>}</span>
                  <span className="row" style={{ ["--g" as string]: "6px" }}><span className="pill">{regionLabel(s.region)}</span><span className="pill">{topicLabel(s.topic)}</span></span>
                </div>
                <StoryFields s={s} />
                <div className="row" style={{ ["--g" as string]: "8px", justifyContent: "flex-end" }}>
                  {s.status === "draft" && <><button formAction={dismissStory} className="btn btn-ghost">Dismiss</button><button formAction={saveStory} className="btn btn-ghost">Save</button><button formAction={publishStory} className="btn btn-red">Publish</button></>}
                  {s.status === "published" && <><button formAction={restoreStory} className="btn btn-ghost">Unpublish</button><button formAction={saveStory} className="btn btn-dark">Save changes</button></>}
                  {s.status === "dismissed" && <button formAction={restoreStory} className="btn btn-ghost">Back to drafts</button>}
                </div>
              </form>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
