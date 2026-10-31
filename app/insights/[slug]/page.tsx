import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getArticle, getArticles, findByLegacySlug, topicSlug } from "@/lib/articles";
import { longDate } from "@/lib/format";
import { NewsletterBand } from "@/components/NewsletterForm";
import { ShareButtons } from "./ShareButtons";
import { site } from "@/content/site";

type P = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const a = getArticle((await params).slug);
  if (!a) return {};
  return { title: a.title, description: a.excerpt, openGraph: { type: "article", title: a.title, description: a.excerpt, publishedTime: a.date, authors: [a.author] } };
}

export default async function ArticlePage({ params }: P) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) {
    const legacy = findByLegacySlug(slug);
    if (legacy) permanentRedirect(`/insights/${legacy.slug}`);
    notFound();
  }
  const related = getArticles().filter((x) => x.slug !== a.slug).slice(0, 3);
  const url = `${site.url}/insights/${a.slug}`;
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: a.title, datePublished: a.date, author: { "@type": "Person", name: a.author }, publisher: { "@type": "Organization", name: site.name } };
  return (
    <>
      <article>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <header className="wrap stack" style={{ ["--g" as string]: "24px", paddingBottom: 40 }}>
          <nav aria-label="Breadcrumb" className="muted" style={{ fontSize: 13 }}>
            <Link href="/">Home</Link> / <Link href="/insights">Insights</Link> / <Link href={`/insights/topic/${topicSlug(a.topic)}`}>{a.topic}</Link>
          </nav>
          <div className="meta"><span className="topic">{a.topic}</span><span>{longDate(a.date)}</span>{a.read && <span>{a.read} read</span>}</div>
          <h1 style={{ fontSize: "clamp(40px,6vw,88px)", lineHeight: .98, letterSpacing: "-.045em", maxWidth: "18ch" }}>{a.title}<span className="dot">.</span></h1>
          <div className="row" style={{ alignItems: "center", ["--g" as string]: "14px" }}>
            <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--sand)" }} aria-hidden="true" />
            <span className="stack" style={{ ["--g" as string]: "0", lineHeight: 1.3 }}><b style={{ fontWeight: 500 }}>{a.author}</b><span className="muted" style={{ fontSize: 13 }}>{site.name}</span></span>
          </div>
        </header>
        <div style={{ maxWidth: "var(--max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          {a.image ? <img src={a.image} alt="" style={{ aspectRatio: "21/9", objectFit: "cover", width: "100%" }} /> : <div className="ph ph-wide">{a.topic}<span className="dot">.</span></div>}
        </div>
        <div className="wrap row" style={{ ["--g" as string]: "48px 80px", alignItems: "flex-start", paddingTop: "clamp(40px,5vw,72px)" }}>
          <aside aria-label="Share" className="stack" style={{ flex: "0 1 200px", ["--g" as string]: "16px" }}>
            <span className="label" style={{ color: "var(--muted)" }}>Share</span>
            <ShareButtons url={url} title={a.title} />
            <span className="label" style={{ color: "var(--muted)", marginTop: 16 }}>Topic</span>
            <div className="row"><Link className="tag" style={{ textDecoration: "none" }} href={`/insights/topic/${topicSlug(a.topic)}`}>{a.topic}</Link></div>
          </aside>
          <div className="prose min0" style={{ flex: "1 1 560px" }} dangerouslySetInnerHTML={{ __html: a.html }} />
        </div>
      </article>
      <section className="paper">
        <div className="wrap tight stack" style={{ ["--g" as string]: "28px" }}>
          <h2 style={{ fontSize: "clamp(30px,3.4vw,44px)", letterSpacing: "-.03em" }}>Keep reading</h2>
          <div className="grid" style={{ ["--min" as string]: "260px", ["--g" as string]: "24px" }}>
            {related.map((r) => (
              <Link key={r.slug} href={`/insights/${r.slug}`} className="stack" style={{ background: "var(--white)", padding: 28, minHeight: 220, textDecoration: "none", ["--g" as string]: "12px" }}>
                <span className="kicker">{r.topic} · {r.date.slice(0, 4)}</span>
                <span className="h3" style={{ fontSize: 22 }}>{r.title}</span>
                <span style={{ marginTop: "auto", fontSize: 13, fontWeight: 600 }}>Read →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <NewsletterBand source={`article:${a.slug}`} />
    </>
  );
}
