import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { events } from "@/content/events";
import { getEvent, isPast, passPriceLabel, upcomingEvents } from "@/lib/events";
import { longDate, weekday } from "@/lib/format";
import { site } from "@/content/site";

type P = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return events.map((e) => ({ slug: e.slug })); }
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const e = getEvent((await params).slug);
  return e ? { title: `${e.series} ${e.city}`, description: e.description } : {};
}
const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;

export default async function EventPage({ params }: P) {
  const e = getEvent((await params).slug);
  if (!e) notFound();
  const past = isPast(e);
  const acc = { ["--acc" as string]: e.accent, ["--on-acc" as string]: e.onAccent };
  const accText = e.accent === "#F5C400" ? "#B38F00" : e.accent;
  const nextOther = upcomingEvents().find((x) => x.slug !== e.slug);
  const canRegister = !past && e.registration !== "closed";
  const jsonLd = { "@context": "https://schema.org", "@type": "Event", name: `${e.series} ${e.city}`, startDate: e.date, eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", location: { "@type": "Place", name: e.venue, address: e.address }, organizer: { "@type": "Organization", name: site.name, url: site.url }, description: e.description };
  return (
    <div style={acc}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="dark">
        <div className="wrap stack" style={v("--g", "clamp(30px,7vw,72px)")}>
          <div className="stack" style={v("--g", "20px")}>
            <span className="label" style={{ color: e.accent === "#1E4FE0" ? "#8FA9F5" : e.accent }}>{e.series} · {site.name}</span>
            <h1 style={{ fontSize: "clamp(52px,17vw,232px)", lineHeight: .85, letterSpacing: "-.06em" }}>{e.city}<span style={{ color: e.accent }}>.</span></h1>
            <p className="lead">{e.description}</p>
            <div className="row" style={{ marginTop: 8 }}>
              {canRegister && <Link className="btn btn-acc" href={`/events/${e.slug}/register`}>Register now →</Link>}
              <a className="btn btn-line" href={`/events/${e.slug}/calendar.ics`}>Add to calendar</a>
            </div>
            {past && <p className="notice" style={{ alignSelf: "flex-start" }}>This event has taken place.</p>}
          </div>
          <div className="facts">
            <div className="fact"><span className="label" style={{ color: "var(--ondark)" }}>Date</span><span className="fact-main">{weekday(e.date)}, {longDate(e.date)}</span>{e.startTime && <span className="fact-sub">From {e.startTime}</span>}</div>
            <div className="fact"><span className="label" style={{ color: "var(--ondark)" }}>Venue</span><span className="fact-main">{e.venue}</span><span className="fact-sub">{e.address}</span></div>
            <div className="fact"><span className="label" style={{ color: "var(--ondark)" }}>Format</span><span className="fact-main">{e.tags[0]}</span><span className="fact-sub">{e.tags.slice(1).join(" · ")}</span></div>
          </div>
        </div>
      </section>

      <section id="programme">
        <div className="wrap row" style={{ ...v("--g", "40px 80px"), alignItems: "flex-start" }}>
          <div className="stack" style={{ flex: "1 1 min(300px, 100%)", ...v("--g", "16px") }}>
            <span className="kicker" style={{ color: accText }}>Programme</span>
            <h2 className="h2-big">Ten conversations<span style={{ color: e.accent }}>.</span></h2>
            <p style={{ color: "var(--ink)", maxWidth: "40ch" }}>Final titles and times are published as speakers confirm.</p>
          </div>
          <ol className="min0" style={{ flex: "2 1 min(560px, 100%)", listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid var(--line)" }}>
            {e.programme.map((p, i) => (
              <li key={i} style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1fr)", gap: "8px 24px", padding: "20px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ fontFamily: "var(--display)", fontWeight: 500, color: "var(--muted)" }}>{p.time}</span>
                <span className="stack" style={v("--g", "2px")}><span className="h3" style={{ fontSize: 21 }}>{p.title}</span>{p.detail && <span className="muted" style={{ fontSize: 13 }}>{p.detail}</span>}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {e.speakers.length > 0 && (
        <section className="paper"><div className="wrap stack" style={v("--g", "32px")}>
          <div className="stack" style={v("--g", "10px")}><span className="kicker" style={{ color: accText }}>Speakers</span><h2 className="h2">On stage in {e.city}</h2></div>
          <div className="grid" style={{ ...v("--min", "220px"), ...v("--g", "32px 20px") }}>
            {e.speakers.map((s) => <div key={s.name} className="stack" style={v("--g", "8px")}>{s.photo ? <img src={s.photo} alt="" style={{ aspectRatio: "4/5", objectFit: "cover" }} /> : <div className="ph" style={{ aspectRatio: "4/5" }} />}<span className="h3" style={{ fontSize: 20 }}>{s.name}</span><span className="muted" style={{ fontSize: 13 }}>{s.title}</span></div>)}
          </div>
        </div></section>
      )}

      {canRegister && (
        <section className={e.speakers.length ? "" : "paper"}>
          <div className="wrap stack" style={v("--g", "32px")}>
            <div className="stack" style={v("--g", "10px")}><span className="kicker" style={{ color: accText }}>Attend</span><h2 className="h2">Choose your pass</h2></div>
            <div className="grid">
              {e.passes.map((p) => (
                <div key={p.id} className="stack" style={{ padding: 32, ...v("--g", "14px"), ...(p.featured ? { background: "var(--acc)", color: "var(--on-acc)" } : { background: "var(--white)", border: "1px solid var(--line)" }) }}>
                  <span className="h3">{p.name}</span>
                  <span style={{ fontFamily: "var(--display)", fontSize: p.priceCents == null && !p.onRequest ? 24 : 44, fontWeight: 300, letterSpacing: "-.03em" }}>{passPriceLabel(p)}</span>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>{p.includes.map((x) => <li key={x}>{x}</li>)}</ul>
                  <Link className="btn" href={p.onRequest ? `/contact?topic=partner` : `/events/${e.slug}/register?pass=${p.id}`} style={{ marginTop: "auto", ...(p.featured ? { background: "var(--white)", color: "var(--black)" } : { background: "var(--black)", color: "var(--white)" }) }}>{p.onRequest ? "Talk to us" : "Select"}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="dark">
        <div className="wrap grid" style={{ ...v("--min", "320px"), ...v("--g", "40px 80px"), alignItems: "center" }}>
          <div className="stack" style={v("--g", "16px")}>
            <span className="label" style={{ color: "var(--ondark)" }}>Venue</span>
            <h2 className="h2">{e.venue}</h2>
            <p style={{ color: "var(--ondark-2)" }}>{e.address}</p>
            <a className="btn btn-line" href={e.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ alignSelf: "flex-start" }}>Open in Maps</a>
          </div>
          {e.photo ? <img src={e.photo} alt={e.venue} style={{ aspectRatio: "4/3", objectFit: "cover" }} /> : <div style={{ aspectRatio: "4/3", background: "#15203A", maxWidth: "100%" }} aria-hidden="true" />}
        </div>
      </section>

      {e.faq.length > 0 && (
        <section><div className="wrap stack" style={{ maxWidth: 960, ...v("--g", "24px") }}>
          <h2 className="h2">Questions</h2>
          <div style={{ borderTop: "1px solid var(--line)" }}>{e.faq.map((q) => <details key={q.q} className="faq"><summary>{q.q}<span className="plus" aria-hidden="true">+</span></summary><p style={{ margin: "0 0 20px", color: "var(--ink)", maxWidth: "64ch" }}>{q.a}</p></details>)}</div>
        </div></section>
      )}

      {nextOther && (
        <section style={{ background: nextOther.accent, color: nextOther.onAccent }}>
          <div className="wrap tight row between">
            <div className="stack" style={v("--g", "8px")}><span className="kicker" style={{ color: "inherit" }}>Next · {longDate(nextOther.date)}</span><span style={{ fontFamily: "var(--display)", fontSize: "clamp(44px,12vw,120px)", lineHeight: .85, letterSpacing: "-.055em" }}>{nextOther.city}.</span></div>
            <Link className="btn btn-dark" href={`/events/${nextOther.slug}`}>See {nextOther.city} →</Link>
          </div>
        </section>
      )}
    </div>
  );
}
