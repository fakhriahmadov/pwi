import Link from "next/link";
import { getArticles } from "@/lib/articles";
import { upcomingEvents } from "@/lib/events";
import { longDate } from "@/lib/format";
import { getPublishedIndexes, featuredIndex, fmtLevel, fmtPct } from "@/lib/research";
import { ArticleCard, EventCard } from "@/components/Cards";
import { NewsletterBand } from "@/components/NewsletterForm";
import { site } from "@/content/site";

// Content comes from the database: refresh at least every 5 minutes (admin saves refresh at once).
export const revalidate = 300;

const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;

export default async function Home() {
  const articles = await getArticles();
  const events = upcomingEvents();
  const next = events[0];
  const indexes = await getPublishedIndexes();
  const feat = featuredIndex(indexes);
  return (
    <>
      <section className="dark">
        <div className="wrap stack" style={v("--g", "clamp(48px,6vw,88px)")}>
          <div className="stack" style={v("--g", "28px")}>
            <span className="label">{site.name}</span>
            <h1 className="display-l" style={{ maxWidth: "14ch" }}>How wealth is made, kept and passed on<span className="dot">.</span></h1>
            <p className="lead">{site.tagline}</p>
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
            <div className="fact">
              <span className="label">Readers</span>
              <span className="fact-main">{site.readers}</span>
              <span className="fact-sub">Research and commentary since {articles.at(-1)?.date.slice(0, 4)}</span>
            </div>
            <Link className="fact" href="/research">
              <span className="label">Research</span>
              <span className="fact-main">{indexes.length ? `${indexes.length} global wealth indexes` : "Global wealth indexes"}</span>
              <span className="fact-sub">{feat?.result.latest ? `${feat.name} · ${feat.result.latest.year}` : "First edition coming soon"}</span>
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap stack" style={v("--g", "40px")}>
          <div className="row between" style={v("--g", "16px 48px")}>
            <div className="stack" style={v("--g", "10px")}>
              <span className="kicker">What we do</span>
              <h2 className="h2" style={{ maxWidth: "18ch" }}>Study it. Explain it. Bring the people together.</h2>
            </div>
            <p className="muted" style={{ maxWidth: "44ch" }}>Three ways in: independent research, regular commentary, and private convenings for founders, families and the people shaping private capital.</p>
          </div>
          <div className="grid">
            <Link href="/research" className="tile"><h3>Research<span className="dot">.</span></h3><p style={{ color: "var(--ink)" }}>The EuroCapital Index and long-run studies of billionaire wealth by country, industry and generation.</p><span className="more" style={{ marginTop: "auto" }}>Explore the index →</span></Link>
            <Link href="/insights" className="tile"><h3>Insights<span className="dot">.</span></h3><p style={{ color: "var(--ink)" }}>Commentary on industries, countries and women &amp; wealth — written for owners of large businesses.</p><span className="more" style={{ marginTop: "auto" }}>All insights →</span></Link>
            <Link href="/events" className="tile dark"><h3>Summits<span className="dot">.</span></h3><p style={{ color: "var(--ondark-2)" }}>Future. Summit — one-day private conversations on how we live, build businesses and shape wealth.</p><span className="more" style={{ marginTop: "auto", color: "var(--white)" }}>All events →</span></Link>
          </div>
        </div>
      </section>

      {events.length > 0 && (
        <section className="paper">
          <div className="wrap stack" style={v("--g", "32px")}>
            <div className="row between">
              <div className="stack" style={v("--g", "10px")}><span className="kicker">Calendar</span><h2 className="h2">Future. Summit</h2></div>
              <Link className="more" href="/events">All events →</Link>
            </div>
            <div className="grid" style={v("--min", "340px")}>{events.map((e) => <EventCard key={e.slug} e={e} />)}</div>
          </div>
        </section>
      )}

      <section>
        <div className="wrap stack" style={v("--g", "32px")}>
          <div className="row between">
            <div className="stack" style={v("--g", "10px")}><span className="kicker">Insights</span><h2 className="h2">Latest research &amp; commentary</h2></div>
            <Link className="more" href="/insights">All insights →</Link>
          </div>
          <div className="grid" style={v("--g", "32px 24px")}>{articles.slice(0, 3).map((a) => <ArticleCard key={a.slug} a={a} />)}</div>
        </div>
      </section>

      <section className="dark">
        <div className="wrap grid" style={{ ...v("--min", "320px"), ...v("--g", "40px 80px"), alignItems: "end" }}>
          <div className="stack" style={v("--g", "20px")}>
            <span className="kicker">{feat ? feat.name : "Research"}</span>
            <h2 className="h2-big">Where the world's private capital is built<span className="dot">.</span></h2>
            <p style={{ color: "var(--ondark-2)", maxWidth: "48ch" }}>Global, regional and generational indexes — from the EuroCapital Index to Gen Z.</p>
            <div><Link className="btn btn-red" href="/research">Explore the index →</Link></div>
          </div>
          <div className="grid" style={v("--min", "160px")}>
            <div className="fact"><span className="label">Index level</span><span className="fact-big">{fmtLevel(feat?.result.latest?.level)}</span><span className="fact-sub">{feat?.result.baseYear ? `${feat.result.baseYear} = 100` : "coming soon"}</span></div>
            <div className="fact"><span className="label">Change</span><span className="fact-big">{fmtPct(feat?.result.changePct)}</span><span className="fact-sub">{feat?.result.previous ? `vs ${feat.result.previous.year}` : ""}</span></div>
            <div className="fact"><span className="label">Indexes</span><span className="fact-big">{indexes.length || "—"}</span><span className="fact-sub">published</span></div>
          </div>
        </div>
      </section>

      <NewsletterBand source="home" />
    </>
  );
}
