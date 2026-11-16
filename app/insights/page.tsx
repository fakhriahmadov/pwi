import Link from "next/link";
import type { Metadata } from "next";
import { getArticles } from "@/lib/articles";
import { reports as fileReports } from "@/content/reports";
import { db, dbConfigured } from "@/lib/db";
import { getPublishedIndexes, featuredIndex, fmtLevel, fmtPct, fmtBn, datasetSummary } from "@/lib/research";
import { NewsletterSignup } from "@/components/NewsletterForm";
import { DataRequestForm, ReportDownload } from "@/app/indexes/forms";
import { IndexExplorer, type ExplorerIndex } from "./IndexExplorer";
import { longDate } from "@/lib/format";
import { bgStyle } from "@/lib/image-specs";
import "./insights.css";
import { HeroIndexLine, IndexTicker } from "@/components/IndexVisuals";
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
  const all = await getPublishedIndexes();
  const feat = featuredIndex(all);
  const ordered = feat ? [feat, ...all.filter((i) => i !== feat)] : all;
  const data = await datasetSummary();
  const dbReports = dbConfigured() ? await db.report.findMany({ where: { status: "published" }, orderBy: [{ date: "desc" }] }).catch(() => []) : [];
  const reports = [...dbReports.map((r) => ({ title: r.title, file: `/media/${r.fileId}`, date: r.date, pages: r.pages ?? undefined, gated: r.gated })), ...fileReports];
  const explorer: ExplorerIndex[] = ordered.map((i) => ({ slug: i.slug, name: i.name, description: i.description, color: i.color, series: i.result.series, changePct: i.result.changePct, baseYear: i.result.baseYear }));
  const ch = (s: { level: number }[], back: number) => (s.length > back ? (s.at(-1)!.level / s.at(-1 - back)!.level - 1) * 100 : null);

  const pubLead = String(c.lead || "").startsWith("Indexes, research") ? "Research, indexes and commentary on how private wealth is created, kept and passed on — across industries, countries and generations." : String(c.lead);
  const fs = feat?.result.series ?? [];
  const lastF = fs.at(-1);
  const leaders = ordered.filter((i) => i.result.series.length > 1).map((i) => ({ i, g: (i.result.series.at(-1)!.level / i.result.series[0].level - 1) * 100 })).sort((a, b) => b.g - a.g);
  const maxG = Math.max(leaders[0]?.g ?? 1, 0.1);
  const since = feat?.result.baseYear ?? fs[0]?.year;
  const side = articles.slice(0, 5);
  const label = { fontSize: 11, fontWeight: 500, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--red-dark)" } as const;
  const big = { fontFamily: "var(--font-display)", fontSize: "clamp(36px, 9vw, 56px)", fontWeight: 300, lineHeight: 1, fontVariantNumeric: "tabular-nums" } as const;
  const factBox = { borderTop: "1px solid var(--ink-line)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 8 } as const;

  return (
    <div className="pi-ins">
      <section style={{ background: "var(--ink)", color: "var(--paper)", position: "relative", overflow: "hidden" }}>
        <HeroIndexLine series={fs} />
        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "clamp(56px, 7vw, 104px) clamp(16px, 4vw, 32px) clamp(40px, 5vw, 64px)", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "clamp(40px, 5vw, 72px)" }}>
          <div className="rise" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--red-dark)" }}>Private Wealth Institute · Research &amp; indexes</span>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(44px, 14vw, 200px)", lineHeight: .88, letterSpacing: "-.055em" }}>Insights<span className="dot">.</span></h1>
            <p style={{ margin: 0, maxWidth: 640, fontSize: "clamp(17px, 1.5vw, 21px)", fontWeight: 300, lineHeight: 1.5, color: "var(--sand-2)" }}>{pubLead}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: "24px 40px" }}>
            <div className="rise" style={{ ...factBox, animationDelay: ".15s" }}><span style={label}>Indexes</span><span style={big}>{all.length || "—"}</span><span style={{ fontSize: 13, color: "var(--stone-2)" }}>Global, regional and generational</span></div>
            <div className="rise" style={{ ...factBox, animationDelay: ".25s" }}><span style={label}>Fortunes tracked</span><span style={big}>{data ? data.count.toLocaleString("en-GB") : "—"}</span><span style={{ fontSize: 13, color: "var(--stone-2)" }}>{data ? `across ${data.countries} countries` : "worldwide"}</span></div>
            <div className="rise" style={{ ...factBox, animationDelay: ".35s" }}><span style={label}>Combined wealth</span><span style={big}>{lastF ? fmtBn(lastF.wealthBn) : "—"}</span><span style={{ fontSize: 13, color: "var(--stone-2)" }}>{lastF ? `in ${lastF.year}${fs.length > 1 ? ` · ${fs.length} years of history` : ""}` : "first figures coming soon"}</span></div>
          </div>
        </div>
        <IndexTicker indexes={ordered} />
      </section>

      <div className="pi-wrap">
        <div className="pi-main">
          <section id="indexes">
            {explorer.length ? <IndexExplorer indexes={explorer} /> : (
              <div style={{ background: "var(--sand)", padding: "clamp(24px,3vw,40px)" }}><p className="h3" style={{ fontSize: 22 }}>The first indexes are being prepared.</p><p className="muted" style={{ marginTop: 8 }}>Subscribe to the newsletter to receive them on publication.</p></div>
            )}
          </section>

          {leaders.length > 1 && (
            <section className="blk-card" style={{ background: "var(--ink)", color: "var(--paper)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: "40px clamp(32px, 5vw, 80px)", alignItems: "start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--red-dark)" }}>Fastest-growing</span>
                  <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(30px, 6vw, 64px)", lineHeight: .98, letterSpacing: "-.04em" }}>Who gained most since {since}<span className="dot">.</span></h2>
                  <p style={{ margin: 0, color: "var(--stone)", maxWidth: "44ch" }}>Growth in combined wealth since each index&apos;s base year.</p>
                </div>
                <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 18 }}>
                  {leaders.map((x, n) => (
                    <li key={x.i.slug} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 12 }}><span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink-subtle)" }}>{String(n + 1).padStart(2, "0")}</span><span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500 }}>{x.i.name.replace(/ Index$/, "")}</span></span>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontVariantNumeric: "tabular-nums" }}>{(x.g >= 0 ? "+" : "−") + Math.abs(x.g).toFixed(0)}%</span>
                      </div>
                      <div style={{ height: 10, background: "var(--ink-raised)" }}><div className="grow" style={{ height: 10, width: `${Math.max(0, (x.g / maxG) * 100).toFixed(1)}%`, background: n === 0 ? "#E5484A" : "#D9D4CC", animationDelay: `${0.2 + n * 0.12}s` }} /></div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          )}

          {all.length > 1 && (
            <section className="blk-card" style={{ background: "var(--sand)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}><span style={{ fontSize: 12, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--red)" }}>All indexes</span><h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(28px, 6vw, 56px)", lineHeight: 1, letterSpacing: "-.035em" }}>Explore by theme</h2></div>
                <div className="mk-list">
                  <div className="mk-head" aria-hidden="true"><span>Index</span><span>{fs.length ? `${fs[0].year}–${lastF!.year}` : "Trend"}</span><span className="mk-num">Level</span><span className="mk-num">1 year</span><span className="mk-num">5 years</span><span className="mk-num">Since {since ?? "base"}</span><span /></div>
                  {ordered.map((i) => {
                    const s = i.result.series, last = s.at(-1);
                    const stats: [string, number | null][] = [["1 year", i.result.changePct], ["5 years", ch(s, 5)], [`Since ${i.result.baseYear ?? "base"}`, last && s[0] ? (last.level / s[0].level - 1) * 100 : null]];
                    const up = i.result.changePct == null || i.result.changePct >= 0;
                    const sp = (() => {
                      if (s.length < 2) return null;
                      let lo = Math.min(...s.map((p) => p.level), 100), hi = Math.max(...s.map((p) => p.level)); const pad = (hi - lo) * 0.12 || 5; lo -= pad; hi += pad;
                      const X = (k: number) => 10 + (k / (s.length - 1)) * 970, Y = (v: number) => 250 - ((v - lo) / (hi - lo)) * 220;
                      const line = s.map((p, k) => X(k).toFixed(1) + "," + Y(p.level).toFixed(1)).join(" ");
                      return { line, area: "M" + line.split(" ").join(" L") + ` L${X(s.length - 1).toFixed(1)},250 L10,250 Z`, y100: Y(100).toFixed(1), dx: (X(s.length - 1) / 10).toFixed(2) + "%", dy: (Y(s.at(-1)!.level) / 3).toFixed(2) + "%" };
                    })();
                    return (
                      <Link key={i.slug} href={`/indexes/${i.slug}`} className="mk-row">
                        <span className="mk-name" style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ flex: "none", width: 10, height: 10, borderRadius: "50%", background: up ? "#0A0A0A" : "#C42F33" }} /><span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, lineHeight: 1.2 }}>{i.name}</span></span>
                          <span style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.4 }}>{i.description}{last ? ` · ${last.count.toLocaleString("en-GB")} fortunes · ${fmtBn(last.wealthBn)}` : ""}</span>
                        </span>
                        <span className="mk-spark" style={{ display: "block", height: 52, position: "relative" }}>
                          {sp && <svg viewBox="0 0 1000 300" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} aria-hidden="true"><path d={sp.area} fill="#0A0A0A" fillOpacity=".06" /><line x1="10" x2="990" y1={sp.y100} y2={sp.y100} stroke="#B5B0A8" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" /><polyline points={sp.line} fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /></svg>}
                          {sp && <span style={{ position: "absolute", width: 8, height: 8, borderRadius: "50%", background: "#C42F33", boxShadow: "0 0 0 3px #FFFFFF", transform: "translate(-50%, -50%)", left: sp.dx, top: sp.dy }} />}
                        </span>
                        <span className="mk-level mk-num" style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, lineHeight: 1 }}>{fmtLevel(last?.level)}</span>
                        <span className="mk-stats">{stats.map(([l, n]) => <span key={l} className="mk-num" style={{ fontSize: 15, fontWeight: 600, color: n == null ? "#8C877F" : n >= 0 ? "#0A0A0A" : "#C42F33" }}><span className="mk-lbl">{l}</span>{fmtPct(n)}</span>)}</span>
                        <span className="mk-go arrow" style={{ fontSize: 18, textAlign: "right" }} aria-hidden="true">→</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section>
            <details className="method">
              <summary className="m-sum" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, cursor: "pointer", listStyle: "none", minHeight: 56, borderTop: "1px solid var(--ink)", borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
                <span style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--red)" }}>Methodology</span><span style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "clamp(18px, 2vw, 22px)", lineHeight: 1.2, letterSpacing: "-.01em" }}>{String(m.methodTitle || "How the indexes are built")}</span></span>
                <span className="m-plus" aria-hidden="true" />
              </summary>
              <div style={{ paddingTop: 28 }}>
                <ol className="steps">
                  {steps.map((st, n) => (
                    <li key={n} style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "2px solid var(--ink)", paddingTop: 20 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: "50%", background: "var(--red)", color: "var(--paper)", fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500 }}>{String(n + 1).padStart(2, "0")}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 500 }}>{st.title}</span>
                      <span style={{ color: "var(--ink-body)", fontSize: 14 }}>{st.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          </section>

          {reports.length > 0 && (
            <section>
              <div className="row" style={{ ...v("--g", "32px 48px"), alignItems: "flex-start" }}>
                <div className="stack min0" style={{ flex: "2 1 min(380px, 100%)", ...v("--g", "16px") }}>
                  <span className="kicker">Reports</span>
                  <h2 className="h2" style={{ fontSize: "clamp(26px,3vw,40px)" }}>Editions &amp; studies</h2>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid var(--line)" }}>
                    {reports.map((r) => (
                      <li key={r.file} className="row between" style={{ padding: "18px 0", borderBottom: "1px solid var(--line)", alignItems: "center", ...v("--g", "12px 24px") }}>
                        <span className="stack" style={v("--g", "0")}><span className="h3" style={{ fontSize: 19 }}>{r.title}</span><span className="muted" style={{ fontSize: 13 }}>PDF{r.pages ? ` · ${r.pages} pages` : ""} · {r.date}</span></span>
                        {r.gated ? <ReportDownload title={r.title} file={r.file} /> : <a href={r.file} style={{ fontSize: 13, fontWeight: 600 }}>Download</a>}
                      </li>
                    ))}
                  </ul>
                </div>
                <DataRequestForm />
              </div>
            </section>
          )}
        </div>

        <aside className="pi-side" aria-label="Latest articles and newsletter">
          <div className="ins-arts side-card">
            <div className="side-head"><span className="side-kicker">Latest articles</span><Link className="side-more" href="/insights/articles">All articles →</Link></div>
            <div className="arts">
              {side.map((a, n) => n === 0 ? (
                <Link key={a.slug} className="art-feat" href={`/insights/${a.slug}`}>
                  <span className="art-cover" style={a.image ? { color: "transparent", ...bgStyle(a.image) } : undefined}>{a.image ? "" : `${a.topic}.`}</span>
                  <span className="art-meta">{a.topic} <span>· {longDate(a.date)}</span></span>
                  <span className="art-t">{a.title}</span>
                  {a.excerpt && <span className="art-x">{a.excerpt}</span>}
                </Link>
              ) : (
                <Link key={a.slug} className="art-row" href={`/insights/${a.slug}`}><span className="art-meta">{a.topic} <span>· {longDate(a.date)}</span></span><span className="art-t">{a.title}</span></Link>
              ))}
              {side.length === 0 && <p style={{ margin: 0, fontSize: 14, color: "var(--ink-muted)" }}>The first articles are on their way.</p>}
            </div>
          </div>
          <div className="ins-news">
            <NewsletterSignup source="insights" title={String(c.newsletterTitle || "The briefing")} text="New research, index updates and upcoming summits, in one calm email, as often as you like." />
          </div>
        </aside>
      </div>
    </div>
  );
}
