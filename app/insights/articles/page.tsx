import Link from "next/link";
import type { Metadata } from "next";
import { getArticles, pickFeatured } from "@/lib/articles";
import { InsightsList } from "./InsightsList";
import { NewsletterBand } from "@/components/NewsletterForm";
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
  return (
    <>
      <section className="dark">
        <div className="wrap tight stack" style={{ ["--g" as string]: "20px" }}>
          <Link href="/insights" className="kicker" style={{ textDecoration: "none" }}>← Insights</Link>
          <h1 className="display-l">All articles<span className="dot">.</span></h1>
          <p className="lead">{all.length} {all.length === 1 ? "article" : "articles"} · {topics.join(" · ")}</p>
        </div>
      </section>
      <InsightsList items={items} topics={topics} featuredSlug={pickFeatured(all)?.slug} />
      <NewsletterBand source="articles" title={String(c.newsletterTitle)} />
    </>
  );
}
