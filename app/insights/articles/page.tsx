import Link from "next/link";
import type { Metadata } from "next";
import { getArticles, pickFeatured } from "@/lib/articles";
import { InsightsList } from "./InsightsList";
import { longDate } from "@/lib/format";
import { getContent } from "@/lib/content";

// Content comes from the database: refresh at least every 5 minutes (admin saves refresh at once).
export const revalidate = 300;

export const metadata: Metadata = { title: "All articles", description: "Every article from the Private Wealth Institute, by topic." };

/** The article archive (the Insights page shows only the latest five). */
export default async function Articles() {
  const c = await getContent("insights");
  const all = await getArticles();
  const topics = Array.from(new Set(all.map((a) => a.topic)));
  const items = all.map(({ html: _h, ...a }) => a);
  const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
  const count = (n: number, one: string) => `${words[n] ?? n} ${n === 1 ? one : one + "s"}`;
  const years = all.map((a) => a.date.slice(0, 4)).filter(Boolean).sort();
  const latest = all[0];
  return (
    <>
      <section className="dark">
        <div className="wrap stack" style={{ ["--g" as string]: "clamp(30px,7vw,72px)" }}>
          <div className="stack" style={{ ["--g" as string]: "24px" }}>
            <Link href="/insights" className="kicker" style={{ textDecoration: "none", color: "var(--red-dark)" }}>← Insights</Link>
            <h1 className="display-xl">All articles<span className="dot">.</span></h1>
            <p className="lead" style={{ maxWidth: 580 }}>Research and commentary on how private wealth is created, kept and passed on — across industries, countries and generations.</p>
          </div>
          <div className="facts">
            {latest && <Link className="fact" href={`/insights/${latest.slug}`}><span className="label">Latest</span><span className="fact-main">{latest.title}</span><span className="fact-sub">{longDate(latest.date)}{latest.read ? ` · ${latest.read} read` : ""}</span></Link>}
            <div className="fact"><span className="label">Archive</span><span className="fact-main">{count(all.length, "article")}</span><span className="fact-sub">{years.length ? `Research and commentary since ${years[0]}` : "First articles coming soon"}</span></div>
            <div className="fact"><span className="label">Topics</span><span className="fact-main">{count(topics.length, "topic")}</span><span className="fact-sub">{topics.join(" · ")}</span></div>
          </div>
        </div>
      </section>
      <InsightsList items={items} topics={topics} featuredSlug={pickFeatured(all)?.slug} />
      <section className="sand">
        <div className="wrap tight row between" style={{ ["--g" as string]: "24px 48px", alignItems: "flex-end" }}>
          <div className="stack" style={{ ["--g" as string]: "12px" }}><span className="kicker">Stay informed</span><h2 className="h2-big">{String(c.bandTitle || "The next insight")}<span className="dot">.</span></h2></div>
          <Link className="btn btn-red" href="/insights#newsletter">Subscribe →</Link>
        </div>
      </section>
    </>
  );
}
