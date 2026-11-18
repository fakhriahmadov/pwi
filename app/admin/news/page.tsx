import Link from "next/link";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { REGIONS, TOPICS, regionLabel, topicLabel } from "@/lib/news";
import { longDate } from "@/lib/format";
import { AdminNav } from "../AdminNav";
import { publishNews, saveNews, dismissNews, restoreNews, fetchNow } from "./actions";
import { Select } from "@/components/Select";

export const metadata: Metadata = { title: "Admin — News", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS = [["candidate", "Inbox"], ["published", "Published"], ["dismissed", "Dismissed"]] as const;
const ago = (d: Date) => { const h = Math.round((Date.now() - +d) / 36e5); return h < 1 ? "just now" : h < 24 ? `${h} h ago` : longDate(d.toISOString().slice(0, 10)); };

export default async function AdminNews({ searchParams }: { searchParams: Promise<{ status?: string; region?: string; topic?: string; msg?: string }> }) {
  const sp = await searchParams;
  const status = STATUS.some(([k]) => k === sp.status) ? sp.status! : "candidate";
  const region = REGIONS.some((r) => r.key === sp.region) ? sp.region : undefined;
  const topic = TOPICS.some((t) => t.key === sp.topic) ? sp.topic : undefined;
  const where = { status, ...(region ? { region } : {}), ...(topic ? { topic } : {}) };
  const [items, counts] = dbConfigured()
    ? await Promise.all([
        db.newsItem.findMany({ where, orderBy: { publishedAt: "desc" }, take: 120 }),
        db.newsItem.groupBy({ by: ["status"], _count: true }),
      ])
    : [[], []];
  const count = (k: string) => counts.find((c) => c.status === k)?._count ?? 0;
  const qs = new URLSearchParams({ status, ...(region ? { region } : {}), ...(topic ? { topic } : {}) }).toString();
  const link = (p: Record<string, string | undefined>) => `/admin/news?${new URLSearchParams(Object.entries({ status, region, topic, ...p }).filter(([, v]) => v) as [string, string][])}`;
  const chip = (on: boolean) => ({ className: "chip", "aria-current": on ? ("page" as const) : undefined });

  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "20px", paddingTop: 40, maxWidth: 1100 }}>
        <div className="row between" style={{ alignItems: "flex-end", ["--g" as string]: "12px 24px" }}>
          <div className="stack" style={{ ["--g" as string]: "6px" }}>
            <h1 className="h2">News<span className="dot">.</span></h1>
            <p className="muted" style={{ maxWidth: "70ch" }}>Headlines are gathered every morning for each topic and region. Publish the ones worth showing — add a one-line takeaway and the key figure — and they appear in “Today in private wealth” on the homepage.</p>
          </div>
          <form action={fetchNow}><input type="hidden" name="qs" value={qs} /><button className="btn btn-dark">Fetch now</button></form>
        </div>
        <AdminNav current="news" />
        {sp.msg && <p className="notice okay" role="status">{sp.msg}</p>}

        <div className="stack" style={{ ["--g" as string]: "10px" }}>
          <nav className="row" aria-label="Status" style={{ ["--g" as string]: "6px" }}>
            {STATUS.map(([k, l]) => <Link key={k} {...chip(status === k)} href={link({ status: k })}>{l} · {count(k)}</Link>)}
          </nav>
          <nav className="row" aria-label="Region" style={{ ["--g" as string]: "6px" }}>
            <Link {...chip(!region)} href={link({ region: undefined })}>All regions</Link>
            {REGIONS.map((r) => <Link key={r.key} {...chip(region === r.key)} href={link({ region: r.key })}>{r.label}</Link>)}
          </nav>
          <nav className="row" aria-label="Topic" style={{ ["--g" as string]: "6px" }}>
            <Link {...chip(!topic)} href={link({ topic: undefined })}>All topics</Link>
            {TOPICS.map((t) => <Link key={t.key} {...chip(topic === t.key)} href={link({ topic: t.key })}>{t.label}</Link>)}
          </nav>
        </div>

        {!items.length && <p className="muted" style={{ padding: "24px 0" }}>{status === "candidate" ? "The inbox is empty. New headlines arrive every morning — or use Fetch now." : "Nothing here yet."}</p>}

        <div className="stack" style={{ ["--g" as string]: "12px" }}>
          {items.map((n) => (
            <form key={n.id} action={saveNews} className="news-edit">
              <input type="hidden" name="id" value={n.id} /><input type="hidden" name="qs" value={qs} />
              <div className="row between" style={{ alignItems: "center", ["--g" as string]: "6px 16px", fontSize: 13 }}>
                <span className="muted">{n.source || "Source"} · {ago(n.publishedAt)} · <a href={n.url} target="_blank" rel="noopener">Open the article ↗</a></span>
                <span className="row" style={{ ["--g" as string]: "6px" }}><span className="pill">{regionLabel(n.region)}</span><span className="pill">{topicLabel(n.topic)}</span></span>
              </div>
              <div className="field"><label htmlFor={`t-${n.id}`}>Headline</label><input id={`t-${n.id}`} name="title" className="input" defaultValue={n.title} required /></div>
              <div className="row" style={{ ["--g" as string]: "12px" }}>
                <div className="field" style={{ flex: "3 1 320px" }}><label htmlFor={`k-${n.id}`}>Our takeaway (one line)</label><input id={`k-${n.id}`} name="takeaway" className="input" defaultValue={n.takeaway ?? ""} placeholder="Why it matters for owners and families" /></div>
                <div className="field" style={{ flex: "1 1 140px" }}><label htmlFor={`f-${n.id}`}>Key figure</label><input id={`f-${n.id}`} name="figure" className="input" defaultValue={n.figure ?? ""} placeholder="+$4.2bn" /></div>
              </div>
              <div className="row" style={{ ["--g" as string]: "12px" }}>
                <div className="field" style={{ flex: "1 1 200px" }}><label htmlFor={`r-${n.id}`}>Region</label><Select id={`r-${n.id}`} name="region" defaultValue={n.region} options={REGIONS.map((r) => ({ value: r.key, label: r.label }))} /></div>
                <div className="field" style={{ flex: "1 1 200px" }}><label htmlFor={`p-${n.id}`}>Topic</label><Select id={`p-${n.id}`} name="topic" defaultValue={n.topic} options={TOPICS.map((t) => ({ value: t.key, label: t.label }))} /></div>
              </div>
              <div className="row" style={{ ["--g" as string]: "8px", justifyContent: "flex-end" }}>
                {status === "candidate" && <><button formAction={dismissNews} value="dismiss" className="btn btn-ghost">Dismiss</button><button formAction={publishNews} value="publish" className="btn btn-red">Publish</button></>}
                {status === "published" && <><button formAction={restoreNews} value="restore" className="btn btn-ghost">Unpublish</button><button formAction={saveNews} value="save" className="btn btn-dark">Save changes</button></>}
                {status === "dismissed" && <button formAction={restoreNews} value="restore" className="btn btn-ghost">Back to the inbox</button>}
              </div>
            </form>
          ))}
        </div>
      </div>
    </section>
  );
}
