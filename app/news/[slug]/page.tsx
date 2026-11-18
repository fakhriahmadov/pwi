import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStory, regionLabel } from "@/lib/news";
import { NewsIcon, NewsRow, dayLabel } from "@/components/NewsBand";

export const revalidate = 300;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const r = await getStory((await params).slug);
  return r ? { title: r.story.title, description: r.story.takeaway || r.story.body.slice(0, 160) } : {};
}

/** One story of the daily brief: our own text, compiled from several sources (listed at the end). */
export default async function Story({ params }: P) {
  const r = await getStory((await params).slug);
  if (!r) notFound();
  const { story: s, more } = r;
  const date = s.eventDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <>
      <section className="dark">
        <div className="wrap stack story-head" style={{ ["--g" as string]: "20px" }}>
          <Link href={`/news?region=${s.region}`} className="label story-back">← Today in private wealth · {regionLabel(s.region)}</Link>
          <h1 className="display-l story-title">{s.title}<span className="dot">.</span></h1>
          <div className="story-facts">
            {s.figure && <span className="story-fig">{s.figure}</span>}
            <span className="story-when"><NewsIcon name="calendar" size={15} />{date}</span>
          </div>
        </div>
      </section>
      <section>
        <div className="wrap story-wrap">
          <article className="story-body">
            {s.takeaway && <p className="story-take"><span className="news-cue"><NewsIcon name={s.topic} size={20} /></span><span><b>Why it matters.</b> {s.takeaway}</span></p>}
            {s.body.split(/\n\s*\n/).map((para, i) => <p key={i}>{para.trim()}</p>)}
            <footer className="story-sources">
              <span className="label">Sources</span>
              <ul>{s.sources.map((src) => <li key={src.url}><a href={src.url} target="_blank" rel="noopener nofollow">{src.name || new URL(src.url).hostname.replace(/^www\./, "")} ↗</a></li>)}</ul>
              <p className="story-note">Compiled by the Private Wealth Institute from {s.sources.length} {s.sources.length === 1 ? "source" : "sources"}{s.aiDrafted ? ", drafted with AI assistance and reviewed by our editors" : ""}.</p>
            </footer>
          </article>
        </div>
      </section>
      {more.length > 0 && (
        <section className="news-band" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="wrap stack" style={{ ["--g" as string]: "20px" }}>
            <h2 className="h3">More from {regionLabel(s.region)}</h2>
            <ol className="news-list">{more.map((n) => <NewsRow key={n.id} n={{ ...n, sourceCount: n.sources.length, eventDate: n.eventDate.toISOString() }} when={dayLabel(n.eventDate.toISOString())} />)}</ol>
          </div>
        </section>
      )}
    </>
  );
}
