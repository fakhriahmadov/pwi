import type { Metadata } from "next";
import { getArticles, pickFeatured } from "@/lib/articles";
import { InsightsList } from "./InsightsList";
import { NewsletterBand } from "@/components/NewsletterForm";
import { longDate } from "@/lib/format";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Insights", description: site.tagline };

export default async function Insights() {
  const all = await getArticles();
  const topics = Array.from(new Set(all.map((a) => a.topic)));
  const latest = all[0];
  const featuredSlug = pickFeatured(all)?.slug;
  const items = all.map(({ html: _h, ...a }) => a);
  return (
    <>
      <section className="dark">
        <div className="wrap stack" style={{ ["--g" as string]: "clamp(30px,7vw,72px)" }}>
          <div className="stack" style={{ ["--g" as string]: "24px" }}>
            <h1 className="display-xl">Insights<span className="dot">.</span></h1>
            <p className="lead">{site.tagline}</p>
          </div>
          <div className="facts">
            {latest && <a className="fact" href={`/insights/${latest.slug}`}><span className="label">Latest</span><span className="fact-main">{latest.title}</span><span className="fact-sub">{longDate(latest.date)}</span></a>}
            <div className="fact"><span className="label">Readers</span><span className="fact-main">{site.readers}</span><span className="fact-sub">Research and commentary since {all.at(-1)?.date.slice(0, 4)}</span></div>
            <div className="fact"><span className="label">Topics</span><span className="fact-main">{topics.length} topics</span><span className="fact-sub">{topics.join(" · ")}</span></div>
          </div>
        </div>
      </section>
      <InsightsList items={items} topics={topics} featuredSlug={featuredSlug} />
      <NewsletterBand source="insights" />
    </>
  );
}
