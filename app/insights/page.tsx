import Link from "next/link";
import type { Metadata } from "next";
import { getArticles } from "@/lib/articles";
import { reports as fileReports } from "@/content/reports";
import { db, dbConfigured } from "@/lib/db";
import { getPublishedIndexes, featuredIndex, fmtLevel, fmtPct, fmtBn, datasetSummary } from "@/lib/research";
import { IndexChart } from "@/components/IndexChart";
import { NewsletterSignup } from "@/components/NewsletterForm";
import { DataRequestForm, ReportDownload } from "@/app/indexes/forms";
import { IndexExplorer, type ExplorerIndex } from "./IndexExplorer";
import { longDate } from "@/lib/format";
import { site } from "@/content/site";
import { getContent } from "@/lib/content";

// Content comes from the database: refresh at least every 5 minutes (admin saves refresh at once).
export const revalidate = 300;

export const metadata: Metadata = { title: "Insights", description: `Indexes, research and commentary on private wealth — ${site.tagline}` };
const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;

/** Insights = the indexes (main column) + the latest articles and the newsletter (side panel). */
export default async function Insights() {
  const c = await getContent("insights");
  const m = await getContent("indexes");
  const steps = (Array.isArray(m.steps) ? m.steps : []) as { title?: string; text?: string }[];
  const articles = await getArticles();
  const latest = articles.slice(0, 5);
  const all = await getPublishedIndexes();
  const feat = featuredIndex(all);
  const ordered = feat ? [feat, ...all.filter((i) => i !== feat)] : all;
  const data = await datasetSummary();
  const dbReports = dbConfigured() ? await db.report.findMany({ where: { status: "published" }, orderBy: [{ date: "desc" }] }).catch(() => []) : [];
  const reports = [...dbReports.map((r) => ({ title: r.title, file: `/media/${r.fileId}`, date: r.date, pages: r.pages ?? undefined, gated: r.gated })), ...fileReports];
  const explorer: ExplorerIndex[] = ordered.map((i) => ({ slug: i.slug, name: i.name, description: i.description, color: i.color, series: i.result.series, changePct: i.result.changePct, baseYear: i.result.baseYear }));
  const ch = (s: { level: number }[], back: number) => (s.length > back ? (s.at(-1)!.level / s.at(-1 - back)!.level - 1) * 100 : null);

  return (
    <>
      <section className="dark">
        <div className="wrap stack" style={v("--g", "clamp(30px,6vw,64px)")}>
          <div className="stack" style={v("--g", "20px")}>
            <h1 className="display-xl">Insights<span className="dot">.</span></h1>
            <p className="lead">{String(c.lead)}</p>
          </div>
          <div className="facts">
            {articles[0] && <Link className="fact" href={`/insights/${articles[0].slug}`}><span className="label">Latest article</span><span className="fact-main">{articles[0].title}</span><span className="fact-sub">{longDate(articles[0].date)}</span></Link>}
            <a className="fact" href="#indexes"><span className="label">Indexes</span><span className="fact-main">{all.length ? `${all.length} wealth indexes` : "First indexes coming soon"}</span><span className="fact-sub">{all.slice(0, 4).map((i) => i.name.replace(/ Index$/, "")).join(" · ")}</span></a>
            <div className="fact"><span className="label">Fortunes tracked</span><span className="fact-main">{data ? data.count.toLocaleString("en") : "—"}</span><span className="fact-sub">{data ? `${data.countries} countries · ${data.year} data` : "worldwide"}</span></div>
          </div>
        </div>
      </section>

      <div className="ins-wrap">
        <div className="ins-main">
          <section id="indexes" className="ins-block ins-explorer">
            {explorer.length ? <IndexExplorer indexes={explorer} /> : (
              <div className="paper" style={{ padding: "clamp(24px,3vw,40px)" }}><p className="h3" style={{ fontSize: 22 }}>The first indexes are being prepared.</p><p className="muted" style={{ marginTop: 8 }}>Subscribe to the newsletter to receive them on publication.</p></div>
            )}
          </section>

          {all.length > 1 && (
            <section className="ins-block ins-themes paper ins-pad">
              <div className="stack" style={v("--g", "8px")}><span className="kicker">All indexes</span><h2 className="h2" style={{ fontSize: "clamp(28px,3.4vw,44px)" }}>Explore by theme</h2></div>
              <div className="mk-list">
                <div className="mk-head" aria-hidden="true"><span>Index</span><span>Trend</span><span className="mk-num">Level</span><span className="mk-num">1 year</span><span className="mk-num">5 years</span><span className="mk-num">Since {all[0].result.baseYear ?? "base"}</span><span /></div>
                {ordered.map((i) => {
                  const s = i.result.series, last = s.at(-1);
                  const stats: [string, number | null][] = [["1 year", i.result.changePct], ["5 years", ch(s, 5)], [`Since ${i.result.baseYear ?? "base"}`, last ? last.level - 100 : null]];
                  return (
                    <Link key={i.slug} href={`/indexes/${i.slug}`} className="mk-row">
                      <span className="mk-name"><span className="row" style={{ ...v("--g", "10px"), alignItems: "center", flexWrap: "nowrap" }}><span className="mk-mark" style={{ background: i.color }} /><b>{i.name}</b></span><span className="muted mk-desc">{i.description}{last ? ` · ${last.count.toLocaleString("en")} fortunes · ${fmtBn(last.wealthBn)}` : ""}</span></span>
                      <span className="mk-spark"><IndexChart series={s} color={i.color} spark label={i.name} /></span>
                      <span className="mk-level mk-num">{fmtLevel(last?.level)}</span>
                      <span className="mk-stats">{stats.map(([l, n]) => <span key={l} className="mk-num mk-stat"><span className="mk-lbl">{l}</span>{fmtPct(n)}</span>)}</span>
                      <span className="mk-go" aria-hidden="true">→</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <section className="ins-block ins-method">
            <details className="method">
              <summary><span className="kicker">Methodology</span><span className="method-title">{String(m.methodTitle)}</span><span className="method-plus" aria-hidden="true" /></summary>
              <ol className="grid method-steps">
                {steps.map((st, n) => (
                  <li key={n} className="stack" style={v("--g", "6px")}><span className="method-n">{String(n + 1).padStart(2, "0")}</span><b className="h3" style={{ fontSize: 19 }}>{st.title}</b><span style={{ color: "var(--ink-body)", fontSize: 14 }}>{st.text}</span></li>
                ))}
              </ol>
            </details>
          </section>

          <section className="ins-block ins-reports">
            <div className="row" style={{ ...v("--g", "32px 48px"), alignItems: "flex-start" }}>
              <div className="stack min0" style={{ flex: "2 1 min(380px, 100%)", ...v("--g", "16px") }}>
                <span className="kicker">Reports</span>
                <h2 className="h2" style={{ fontSize: "clamp(26px,3vw,40px)" }}>Editions &amp; studies</h2>
                {reports.length === 0 ? <p className="muted">No reports published yet. The first edition will appear here.</p> : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid var(--line)" }}>
                    {reports.map((r) => (
                      <li key={r.file} className="row between" style={{ padding: "18px 0", borderBottom: "1px solid var(--line)", alignItems: "center", ...v("--g", "12px 24px") }}>
                        <span className="stack" style={v("--g", "0")}><span className="h3" style={{ fontSize: 19 }}>{r.title}</span><span className="muted" style={{ fontSize: 13 }}>PDF{r.pages ? ` · ${r.pages} pages` : ""} · {r.date}</span></span>
                        {r.gated ? <ReportDownload title={r.title} file={r.file} /> : <a href={r.file} style={{ fontSize: 13, fontWeight: 600 }}>Download</a>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <DataRequestForm />
            </div>
          </section>
        </div>

        <aside className="ins-aside" aria-label="Latest articles and newsletter">
          <section className="ins-block ins-latest">
            <div className="row between" style={{ ...v("--g", "8px"), alignItems: "baseline" }}>
              <span className="kicker">Latest articles</span>
              <Link className="more" href="/insights/articles">All articles →</Link>
            </div>
            <ol className="latest">
              {latest.map((a, n) => (
                <li key={a.slug}>
                  {n === 0 && a.image && <Link href={`/insights/${a.slug}`} tabIndex={-1} aria-hidden="true"><img src={a.image} alt="" className="latest-img" /></Link>}
                  <div className="meta"><span className="topic">{a.topic}</span><span>{longDate(a.date)}</span></div>
                  <Link href={`/insights/${a.slug}`} className={n === 0 ? "latest-title big" : "latest-title"}>{a.title}</Link>
                  {n === 0 && a.excerpt && <p className="muted" style={{ fontSize: 14 }}>{a.excerpt}</p>}
                </li>
              ))}
            </ol>
            {articles.length === 0 && <p className="muted">The first articles are on their way.</p>}
          </section>
          <section className="ins-block ins-news">
            <NewsletterSignup source="insights" title={String(c.newsletterTitle || "The briefing")} />
          </section>
        </aside>
      </div>
    </>
  );
}
