import Link from "next/link";
import { getArticles } from "@/lib/articles";
import { upcomingEvents, pastEvents } from "@/lib/events";
import { longDate, dayOfMonth, monthYear } from "@/lib/format";
import { getPublishedIndexes, featuredIndex, fmtLevel, fmtPct, datasetSummary } from "@/lib/research";
import { ArticleCard, EventCard } from "@/components/Cards";
import { NewsletterBand } from "@/components/NewsletterForm";
import { site } from "@/content/site";
import { getContent } from "@/lib/content";
import { HeroIndexLine, IndexTicker, IndexBandChart } from "@/components/IndexVisuals";
import "./insights/insights.css";

type Pillar = { title?: string; text?: string; link?: string };

// Content comes from the database: refresh at least every 5 minutes (admin saves refresh at once).
export const revalidate = 300;

const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;

export default async function Home() {
  const c = await getContent("home");
  const saved = (Array.isArray(c.pillars) ? c.pillars : []) as Pillar[];
  // Older saves had three tiles (Indexes, Insights, Summits); Indexes now live inside Insights.
  const pillars = saved.length >= 3 ? [saved[1], saved[2]] : saved;
  const P = (i: number): Pillar => pillars[i] ?? {};
  const articles = await getArticles();
  const events = await upcomingEvents();
  const next = events[0];
  const past = await pastEvents();
  const indexes = await getPublishedIndexes();
  const feat = featuredIndex(indexes);
  const data = await datasetSummary();
  return (
    <>
      <section className="dark pi-ins" style={{ position: "relative", overflow: "hidden" }}>
        <HeroIndexLine series={feat?.result.series ?? []} />
        <div className="wrap stack" style={{ ...v("--g", "clamp(48px,6vw,88px)"), position: "relative" }}>
          <div className="stack rise" style={v("--g", "28px")}>
            <span className="label">{String(c.kicker)}</span>
            <h1 className="display-l" style={{ maxWidth: "14ch" }}>{String(c.headline).replace(/\.$/, "")}<span className="dot">.</span></h1>
            <p className="lead">{String(c.lead)}</p>
            <div className="row" style={{ marginTop: 8 }}>
              {articles[0] && <Link className="btn btn-red" href={`/insights/${articles[0].slug}`}>Read the latest insight →</Link>}
              {next && <Link className="btn btn-line" href={`/events/${next.slug}`}>{next.series} {next.city}</Link>}
            </div>
          </div>
          <div className="facts">
            {next && (
              <Link className="fact" href={`/events/${next.slug}`}>
                <span className="label">Next summit</span>
                <span className="fact-main">{next.city} · {longDate(next.date)}</span>
                <span className="fact-sub">{next.venue}</span>
              </Link>
            )}
            {articles[0] && (
              <Link className="fact" href={`/insights/${articles[0].slug}`}>
                <span className="label">Latest article</span>
                <span className="fact-main">{articles[0].title}</span>
                <span className="fact-sub">{articles[0].topic} · {longDate(articles[0].date)}</span>
              </Link>
            )}
            <Link className="fact" href="/insights#indexes">
              <span className="label">Insights</span>
              <span className="fact-main">{feat?.result.latest ? `${feat.name} ${fmtLevel(feat.result.latest.level)}` : "Global wealth indexes"}</span>
              <span className="fact-sub">{feat?.result.latest ? `${fmtPct(feat.result.changePct)} in ${feat.result.latest.year} · ${indexes.length} indexes` : "First edition coming soon"}</span>
            </Link>
          </div>
        </div>
        <IndexTicker indexes={indexes} />
      </section>

      <section>
        <div className="wrap stack" style={v("--g", "40px")}>
          <div className="row between" style={v("--g", "16px 48px")}>
            <div className="stack" style={v("--g", "10px")}>
              <span className="kicker">{String(c.pillarsKicker)}</span>
              <h2 className="h2" style={{ maxWidth: "18ch" }}>{String(c.pillarsTitle)}</h2>
            </div>
            <p className="muted" style={{ maxWidth: "44ch" }}>{String(c.pillarsIntro)}</p>
          </div>
          <div className="grid" style={v("--min", "340px")}>
            <Link href="/insights" className="tile">
              <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500, color: "var(--ink-muted)" }}>01</span>
              <h3>{P(0).title}<span className="dot">.</span></h3><p style={{ color: "var(--ink-body)" }}>{P(0).text}</p>
              {indexes.length > 0 && (
                <span style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", gap: 12, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                  {indexes.slice(0, 1).map((i) => (
                    <span key={i.slug} style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--ink-muted)" }}>{i.name}</span><span style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 300 }}>{fmtLevel(i.result.latest?.level)} <span style={{ fontSize: 13, fontWeight: 600 }}>{i.result.changePct == null ? "" : `${i.result.changePct >= 0 ? "▲" : "▼"} ${Math.abs(i.result.changePct).toFixed(1)}%`}</span></span></span>
                  ))}
                  {articles[0] && <span style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--ink-muted)" }}>Latest article</span><span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500, lineHeight: 1.3 }}>{articles[0].title}</span></span>}
                </span>
              )}
              <span className="more" style={{ marginTop: "auto" }}>{P(0).link}</span></Link>
            <Link href="/events" className="tile dark"><span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500, color: "var(--stone-2)" }}>02</span><h3>{P(1).title}<span className="dot">.</span></h3><p style={{ color: "var(--stone)" }}>{P(1).text}</p>
              {(next || past[0]) && (
                <span style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", gap: 12, borderTop: "1px solid var(--ink-line)", paddingTop: 14 }}>
                  {next && <span style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--stone-2)" }}>Next summit</span><span style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 300 }}>{next.city} <span style={{ fontSize: 13, fontWeight: 600 }}>{dayOfMonth(next.date)} {monthYear(next.date).replace(/^(\w{3})\w*/, "$1")}</span></span></span>}
                  {past[0] && <span style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--stone-2)" }}>Previous</span><span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500, lineHeight: 1.3 }}>{past.slice(0, 2).map((e) => `${e.city} ${e.date.slice(0, 4)}`).join(" · ")}</span></span>}
                </span>
              )}
              <span className="more" style={{ marginTop: "auto", color: "var(--paper)" }}>{P(1).link}</span></Link>
          </div>
        </div>
      </section>

      {events.length > 0 && (
        <section className="paper">
          <div className="wrap stack" style={v("--g", "32px")}>
            <div className="row between">
              <div className="stack" style={v("--g", "10px")}><span className="kicker">Calendar</span><h2 className="h2">{String(c.eventsTitle)}</h2></div>
              <Link className="more" href="/events">All events →</Link>
            </div>
            <div className="grid" style={v("--min", "340px")}>{events.map((e) => <EventCard key={e.slug} e={e} />)}</div>
          </div>
        </section>
      )}

      <section>
        <div className="wrap stack" style={v("--g", "32px")}>
          <div className="row between">
            <div className="stack" style={v("--g", "10px")}><span className="kicker">Insights</span><h2 className="h2">{String(c.insightsTitle)}</h2></div>
            <Link className="more" href="/insights">All insights →</Link>
          </div>
          <div className="grid" style={v("--g", "32px 24px")}>{articles.slice(0, 3).map((a) => <ArticleCard key={a.slug} a={a} />)}</div>
        </div>
      </section>

      <section className="dark">
        <div className="wrap grid pi-ins" style={{ ...v("--min", "320px"), ...v("--g", "40px 80px"), alignItems: "center" }}>
          <div className="stack" style={v("--g", "20px")}>
            <span className="kicker">Global wealth indexes</span>
            <h2 className="h2-big">{String(c.indexesTitle).replace(/\.$/, "")}<span className="dot">.</span></h2>
            <p style={{ color: "var(--stone)", maxWidth: "48ch" }}>{String(c.indexesText)}</p>
            <div><Link className="btn btn-red" href="/insights#indexes">Explore the indexes →</Link></div>
          </div>
          <div className="stack" style={v("--g", "28px")}>
            {feat && <IndexBandChart index={feat} />}
            <div className="grid" style={{ ...v("--min", "140px"), ...v("--g", "24px") }}>
              <div className="fact"><span className="label">Countries</span><span className="fact-big">{data ? data.countries : "—"}</span><span className="fact-sub">covered</span></div>
              <div className="fact"><span className="label">Fortunes</span><span className="fact-big">{data ? data.count.toLocaleString("en") : "—"}</span><span className="fact-sub">tracked</span></div>
              <div className="fact"><span className="label">Since</span><span className="fact-big">{feat?.result.baseYear ?? "—"}</span><span className="fact-sub">of data</span></div>
            </div>
          </div>
        </div>
      </section>

      <NewsletterBand source="home" title={String(c.newsletterTitle || "The next insight")} text={!c.newsletterText || String(c.newsletterText).startsWith("Research, index updates") ? undefined : String(c.newsletterText)} />
    </>
  );
}
