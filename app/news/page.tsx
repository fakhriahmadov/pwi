import Link from "next/link";
import type { Metadata } from "next";
import { REGIONS, regionLabel, allNews } from "@/lib/news";
import { NewsRow } from "@/components/NewsRow";

export const metadata: Metadata = { title: "News", description: "The daily brief from the Private Wealth Institute: fortunes, new companies and failures that matter to owners and families, by region." };
export const revalidate = 300;

/** All published stories, by region, grouped by day. */
export default async function News({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const sp = await searchParams;
  const region = REGIONS.some((r) => r.key === sp.region) ? sp.region : undefined;
  const items = await allNews(region);
  const days = new Map<string, typeof items>();
  for (const n of items) { const d = n.eventDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); days.set(d, [...(days.get(d) ?? []), n]); }
  return (
    <>
      <section className="dark">
        <div className="wrap stack" style={{ ["--g" as string]: "20px", paddingBottom: 40 }}>
          <span className="label">Daily brief</span>
          <h1 className="display-l" style={{ fontSize: "clamp(36px,7vw,80px)" }}>Today in private wealth<span className="dot">.</span></h1>
          <p className="lead" style={{ maxWidth: "60ch" }}>Short stories compiled each morning by the institute from several sources — with a line on why each one matters to owners and families.</p>
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
              <ol className="news-list">
                {list.map((n) => <NewsRow key={n.id} n={{ ...n, sourceCount: n.sources.length, eventDate: n.eventDate.toISOString() }} when={region ? "" : regionLabel(n.region)} />)}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
