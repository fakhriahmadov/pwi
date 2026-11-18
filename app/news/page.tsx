import Link from "next/link";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { REGIONS, TOPICS, regionLabel, topicLabel } from "@/lib/news";

export const metadata: Metadata = { title: "News", description: "Billionaires, new unicorns and bankruptcies — the daily brief from the Private Wealth Institute, by region." };
export const revalidate = 300;

/** All published news, by region and topic, grouped by day. */
export default async function News({ searchParams }: { searchParams: Promise<{ region?: string; topic?: string }> }) {
  const sp = await searchParams;
  const region = REGIONS.some((r) => r.key === sp.region) ? sp.region : undefined;
  const topic = TOPICS.some((t) => t.key === sp.topic) ? sp.topic : undefined;
  const items = dbConfigured()
    ? await db.newsItem.findMany({ where: { status: "published", ...(region ? { region } : {}), ...(topic ? { topic } : {}) }, orderBy: { publishedAt: "desc" }, take: 150 }).catch(() => [])
    : [];
  const days = new Map<string, typeof items>();
  for (const n of items) { const d = n.publishedAt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Vienna" }); days.set(d, [...(days.get(d) ?? []), n]); }
  const link = (p: Record<string, string | undefined>) => { const q = new URLSearchParams(Object.entries({ region, topic, ...p }).filter(([, v]) => v) as [string, string][]).toString(); return q ? `/news?${q}` : "/news"; };
  return (
    <>
      <section className="dark">
        <div className="wrap stack" style={{ ["--g" as string]: "20px", paddingBottom: 40 }}>
          <span className="label">Daily brief</span>
          <h1 className="display-l" style={{ fontSize: "clamp(36px,7vw,80px)" }}>Today in private wealth<span className="dot">.</span></h1>
          <p className="lead" style={{ maxWidth: "60ch" }}>Billionaires, new unicorns and bankruptcies — chosen each morning by the institute, with why each one matters.</p>
        </div>
      </section>
      <section className="news-band" style={{ borderBottom: 0 }}>
        <div className="wrap stack" style={{ ["--g" as string]: "24px" }}>
          <nav className="news-tabs" aria-label="Region">
            <Link href={link({ region: undefined })} aria-current={!region ? "page" : undefined}>All regions</Link>
            {REGIONS.map((r) => <Link key={r.key} href={link({ region: r.key })} aria-current={region === r.key ? "page" : undefined}>{r.label}</Link>)}
          </nav>
          <nav className="row" aria-label="Topic" style={{ ["--g" as string]: "6px" }}>
            <Link className="chip" href={link({ topic: undefined })} aria-current={!topic ? "page" : undefined}>All topics</Link>
            {TOPICS.map((t) => <Link key={t.key} className="chip" href={link({ topic: t.key })} aria-current={topic === t.key ? "page" : undefined}>{t.label}</Link>)}
          </nav>
          {!items.length && <p className="news-empty">No news here yet.</p>}
          {[...days].map(([day, list]) => (
            <div key={day} className="stack" style={{ ["--g" as string]: "4px" }}>
              <h2 className="news-day">{day}</h2>
              <ol className="news-list news-archive">
                {list.map((n) => (
                  <li key={n.id} className={`news-${n.topic}`}>
                    <span className="news-meta">{topicLabel(n.topic)} · {regionLabel(n.region)}{n.source ? ` · ${n.source}` : ""}</span>
                    <div className="news-row">
                      {n.figure && <span className="news-fig">{n.figure}</span>}
                      <div className="stack" style={{ ["--g" as string]: "4px" }}>
                        <a className="news-title" href={n.url} target="_blank" rel="noopener">{n.title}</a>
                        {n.takeaway && <p className="news-take">{n.takeaway}</p>}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
