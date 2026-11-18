import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStory, regionLabel } from "@/lib/news";
import { NewsIcon, NewsRow, dayLabel } from "@/components/NewsRow";
import { CopyLink } from "@/components/CopyLink";
import { site } from "@/content/site";

export const revalidate = 300;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const r = await getStory((await params).slug);
  return r ? { title: r.story.title, description: r.story.takeaway || r.story.body.slice(0, 160) } : {};
}

/** Share buttons: LinkedIn, X, email and copy link. */
function Share({ url, title, className, label = "Share" }: { url: string; title: string; className: string; label?: string }) {
  return (
    <div className={className}>
      <span className="label">{label}</span>
      <div>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener" aria-label="Share on LinkedIn" title="LinkedIn"><NewsIcon name="linkedin" size={17} /><span className="share-t">LinkedIn</span></a>
        <a href={`https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener" aria-label="Share on X" title="X"><NewsIcon name="x" size={15} /><span className="share-t">X</span></a>
        <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`} aria-label="Share by email" title="Email"><NewsIcon name="mail" size={17} /><span className="share-t">Email</span></a>
        <CopyLink url={url} className="story-copy"><NewsIcon name="link" size={16} /></CopyLink>
      </div>
    </div>
  );
}

/** One story of the daily brief: our own text, compiled from several sources (listed at the end). */
export default async function Story({ params }: P) {
  const r = await getStory((await params).slug);
  if (!r) notFound();
  const { story: s, more } = r;
  const url = `${site.url.replace(/\/$/, "")}/news/${s.slug}`;
  const date = s.eventDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const dateShort = s.eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return (
    <>
      <section className="dark">
        <div className="wrap stack story-head" style={{ ["--g" as string]: "20px" }}>
          <Link href={`/news?region=${s.region}`} className="label story-back">← Today in private wealth · {regionLabel(s.region)}</Link>
          <h1 className="display-l story-title">{s.title}<span className="dot">.</span></h1>

        </div>
      </section>
      <section>
        <div className="wrap story-wrap">
          <aside className="story-aside" aria-label="About this story">
            <dl className="story-card">
              {s.figure && <div className="story-card-fig"><dt>Key figure</dt><dd>{s.figure}</dd></div>}
              <div><dt><NewsIcon name="calendar" size={14} />Date</dt><dd><span className="d-long">{date}</span><span className="d-short">{dateShort}</span></dd></div>
              <div><dt><NewsIcon name="pin" size={14} />Region</dt><dd><Link href={`/news?region=${s.region}`}>{regionLabel(s.region)}</Link></dd></div>
              <div><dt><NewsIcon name="sources" size={14} />Sources</dt><dd><a href="#sources">{s.sources.length} {s.sources.length === 1 ? "outlet" : "outlets"}</a></dd></div>
            </dl>
            <Share url={url} title={s.title} className="story-share story-share-side" />
          </aside>
          <article className="story-body">
            {s.takeaway && <p className="story-take"><span className="news-cue"><NewsIcon name={s.topic} size={20} /></span><span><b>Why it matters.</b> {s.takeaway}</span></p>}
            {s.body.split(/\n\s*\n/).map((para, i) => <p key={i}>{para.trim()}</p>)}
            <footer className="story-sources" id="sources">
              <span className="label">Sources</span>
              <ul>{s.sources.map((src) => <li key={src.url}><a href={src.url} target="_blank" rel="noopener nofollow">{src.name || new URL(src.url).hostname.replace(/^www\./, "")} ↗</a></li>)}</ul>
              <p className="story-note">Compiled by the Private Wealth Institute from {s.sources.length} {s.sources.length === 1 ? "source" : "sources"}{s.aiDrafted ? ", drafted with AI assistance and reviewed by our editors" : ""}.</p>
              <Share url={url} title={s.title} className="story-share story-share-end" label="Share this story" />
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
