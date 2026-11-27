import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStory, regionLabel } from "@/lib/news";
import { CUE, NewsIcon, Reads, dayLabel } from "@/components/NewsRow";
import { CopyLink } from "@/components/CopyLink";
import { StoryArt } from "@/components/StoryArt";
import { ReadBeacon } from "@/components/ReadBeacon";
import { JsonLd, abs, breadcrumbLd, orgId } from "@/lib/seo";

const THEME: Record<string, string> = { billionaires: "Fortunes", unicorns: "New companies", bankruptcies: "Failures" };
import { site } from "@/content/site";

export const revalidate = 300;
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const r = await getStory((await params).slug);
  if (!r) return {};
  const s = r.story, description = s.takeaway || s.body.slice(0, 160);
  return { title: s.title, description, alternates: { canonical: `/news/${s.slug}` },
    openGraph: { type: "article", title: s.title, description, url: `/news/${s.slug}`, publishedTime: s.eventDate.toISOString(), modifiedTime: (s.approvedAt ?? s.eventDate).toISOString(), section: regionLabel(s.region) } };
}

/** Share buttons: LinkedIn, X, email and copy link. */
function Share({ url, title, className, label = "Share", note }: { url: string; title: string; className: string; label?: string; note?: string }) {
  return (
    <div className={className}>
      {note ? <p className="share-h"><b>{label}</b><span>{note}</span></p> : <span className="label">{label}</span>}
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
  const minutes = Math.max(1, Math.round(s.body.split(/\s+/).length / 200));
  const dateShort = s.eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return (
    <>
      <ReadBeacon slug={s.slug} />
      <JsonLd data={[{
        "@context": "https://schema.org", "@type": "NewsArticle", "@id": `${url}#article`, mainEntityOfPage: url, url,
        headline: s.title, description: s.takeaway || undefined, articleBody: s.body, wordCount: s.body.split(/\s+/).length,
        datePublished: s.eventDate.toISOString(), dateModified: (s.approvedAt ?? s.eventDate).toISOString(),
        articleSection: THEME[s.topic] ?? "News", keywords: [THEME[s.topic], regionLabel(s.region), "private wealth"].filter(Boolean).join(", "),
        spatialCoverage: { "@type": "Place", name: regionLabel(s.region) }, inLanguage: "en-GB", isAccessibleForFree: true,
        author: { "@id": orgId }, publisher: { "@id": orgId }, image: abs("/icon.png"),
        isBasedOn: s.sources.map((x) => ({ "@type": "NewsArticle", url: x.url, publisher: { "@type": "Organization", name: x.name } })),
      }, breadcrumbLd([["Home", "/"], ["Daily brief", "/news"], [regionLabel(s.region), `/news?region=${s.region}`], [s.title, `/news/${s.slug}`]])]} />
      <section className="dark">
        <div className="wrap story-head">
          <div className="stack story-head-main" style={{ ["--g" as string]: "22px" }}>
            <Link href={`/news?region=${s.region}`} className="label story-back">← Today in private wealth · {regionLabel(s.region)}</Link>
            <h1 className="display-l story-title">{s.title}<span className="dot">.</span></h1>
            <p className="story-meta">
              <span className={`story-theme news-t-${s.topic}`}><NewsIcon name={s.topic} size={15} />{THEME[s.topic] ?? "News"}</span>
              <span className="m-hide">{dateShort}</span><span className="m-hide">{regionLabel(s.region)}</span><span className="m-hide">{s.sources.length} {s.sources.length === 1 ? "source" : "sources"}</span><span className="m-first">{minutes} min read</span>{s.reads > 0 && <span><Reads n={s.reads} /></span>}
            </p>
          </div>
          <div className={`story-visual news-t-${s.topic}`} aria-hidden={!s.figure}>
            <span className="story-visual-k">{s.figure ? "Key figure" : "Theme"}</span>
            <span className="story-visual-v">{s.figure || (THEME[s.topic] ?? "News")}</span>
            <StoryArt topic={s.topic} />
          </div>

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
            {s.takeaway && <p className="story-take"><span className="story-take-k">Why it matters</span><span>{s.takeaway}</span></p>}
            {s.body.split(/\n\s*\n/).map((para, i) => <p key={i} className={i === 0 ? "story-lead" : undefined}>{para.trim()}</p>)}
            <footer className="story-sources" id="sources">
              <span className="label">Sources</span>
              <ul>{s.sources.map((src) => <li key={src.url}><a href={src.url} target="_blank" rel="noopener nofollow">{src.name || new URL(src.url).hostname.replace(/^www\./, "")} ↗</a></li>)}</ul>
              <p className="story-note">Compiled by the Private Wealth Institute from {s.sources.length} {s.sources.length === 1 ? "source" : "sources"}{s.aiDrafted ? ", drafted with AI assistance and reviewed by our editors" : ""}.</p>
              <Share url={url} title={s.title} className="story-share story-share-end" label="Share this story" note="Send it to someone who would find it useful." />
            </footer>
          </article>
        </div>
      </section>
      {more.length > 0 && (
        <section className="story-more" aria-labelledby="more-h">
          <div className="wrap stack" style={{ ["--g" as string]: "clamp(20px,2.5vw,28px)" }}>
            <div className="story-more-head">
              <h2 id="more-h" className="h3">More from {regionLabel(s.region)}<span className="dot">.</span></h2>
              <Link href={`/news?region=${s.region}`} className="news-all">All {regionLabel(s.region)} news <NewsIcon name="arrow" size={15} /></Link>
            </div>
            <ul className="story-more-grid">
              {more.map((n) => (
                <li key={n.id} className={`more-card news-t-${n.topic}`}>
                  <div className="more-top">
                    <span className="news-cue" title={CUE[n.topic]}><NewsIcon name={n.topic} size={18} /></span>
                    {n.figure && <span className="more-fig">{n.figure}</span>}
                  </div>
                  <h3><Link href={`/news/${n.slug}`} className="more-link">{n.title}</Link></h3>
                  {n.takeaway && <p className="more-take">{n.takeaway}</p>}
                  <p className="more-meta"><span>{n.sources.length} {n.sources.length === 1 ? "source" : "sources"}</span><span className="news-when"><NewsIcon name="clock" size={13} />{dayLabel(n.eventDate.toISOString())}</span><Reads n={n.reads} /><span className="more-go" aria-hidden="true"><NewsIcon name="arrow" size={15} /></span></p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
