import Link from "next/link";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { REGIONS, regionLabel } from "@/lib/news";
import { NewsRow } from "@/components/NewsBand";

export const metadata: Metadata = { title: "News", description: "The daily brief from the Private Wealth Institute: fortunes, new unicorns and failures that matter to owners and families, by region." };
export const revalidate = 300;

/** All published news, by region, grouped by day — one plain list. */
export default async function News({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const sp = await searchParams;
  const region = REGIONS.some((r) => r.key === sp.region) ? sp.region : undefined;
  const items = dbConfigured()
    ? await db.newsItem.findMany({ where: { status: "published", ...(region ? { region } : {}) }, orderBy: { publishedAt: "desc" }, take: 150 }).catch(() => [])
    : [];
  const days = new Map<string, typeof items>();
  for (const n of items) { const d = n.publishedAt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Vienna" }); days.set(d, [...(days.get(d) ?? []), n]); }
  const time = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" });
  return (
    <>
      <section className="dark">
        <div className="wrap stack" style={{ ["--g" as string]: "20px", paddingBottom: 40 }}>
          <span className="label">Daily brief</span>
          <h1 className="display-l" style={{ fontSize: "clamp(36px,7vw,80px)" }}>Today in private wealth<span className="dot">.</span></h1>
          <p className="lead" style={{ maxWidth: "60ch" }}>Chosen each morning by the institute — with a line on why each one matters to owners and families.</p>
        </div>
      </section>
      <section className="news-band" style={{ borderBottom: 0 }}>
        <div className="wrap stack" style={{ ["--g" as string]: "28px" }}>
          <nav className="news-tabs" aria-label="Region">
            <Link href="/news" aria-current={!region ? "page" : undefined}>All regions</Link>
            {REGIONS.map((r) => <Link key={r.key} href={`/news?region=${r.key}`} aria-current={region === r.key ? "page" : undefined}>{r.label}</Link>)}
          </nav>
          {!items.length && <p className="news-empty">No news here yet.</p>}
          {[...days].map(([day, list]) => (
            <div key={day} className="stack" style={{ ["--g" as string]: "0px" }}>
              <h2 className="news-day">{day}</h2>
              <ol className="news-list" style={{ borderTop: 0 }}>
                {list.map((n) => <NewsRow key={n.id} n={{ ...n, publishedAt: n.publishedAt.toISOString() }} when={region ? time(n.publishedAt) : `${regionLabel(n.region)} · ${time(n.publishedAt)}`} />)}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
