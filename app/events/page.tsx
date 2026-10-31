import type { Metadata } from "next";
import Link from "next/link";
import { upcomingEvents, pastEvents } from "@/lib/events";
import { longDate } from "@/lib/format";
import { EventCard } from "@/components/Cards";
import { NewsletterBand } from "@/components/NewsletterForm";

export const metadata: Metadata = { title: "Events", description: "Future. Summit — private conversations on how we live, build businesses and shape wealth." };

export default function Events() {
  const up = upcomingEvents();
  const past = pastEvents();
  return (
    <>
      <section className="dark">
        <div className="wrap stack" style={{ ["--g" as string]: "clamp(30px,7vw,72px)" }}>
          <div className="stack" style={{ ["--g" as string]: "24px" }}>
            <h1 className="display-xl">Events<span className="dot">.</span></h1>
            <p className="lead">Private conversations on how we live, build businesses and shape wealth — in the places that set the tone.</p>
          </div>
          <div className="facts">
            <div className="fact"><span className="label">Next event</span><span className="fact-main">{up[0] ? `${up[0].series} ${up[0].city}` : "To be announced"}</span><span className="fact-sub">{up[0] ? `${longDate(up[0].date)} · ${up[0].venue}` : "New dates coming soon"}</span></div>
            <div className="fact"><span className="label">Upcoming</span><span className="fact-main">{up.length} {up.length === 1 ? "summit" : "summits"}</span><span className="fact-sub">{up.map((e) => e.city).join(" · ")}</span></div>
            <div className="fact"><span className="label">Format</span><span className="fact-main">One-day summits</span><span className="fact-sub">Conversations, networking and evening programmes</span></div>
          </div>
        </div>
      </section>
      <section className="paper">
        <div className="wrap stack" style={{ ["--g" as string]: "24px" }}>
          <div className="stack" style={{ ["--g" as string]: "8px" }}><span className="kicker">Calendar</span><h2 className="h2">Upcoming events</h2></div>
          {up.length ? <div className="grid" style={{ ["--min" as string]: "340px" }}>{up.map((e) => <EventCard key={e.slug} e={e} />)}</div> : <p>New dates will be announced soon.</p>}
          {past.length > 0 && (
            <div id="past" className="stack" style={{ ["--g" as string]: "16px", marginTop: 48 }}>
              <div className="stack" style={{ ["--g" as string]: "8px" }}><span className="kicker">Archive</span><h2 className="h2">Past events</h2></div>
              <ol className="rows">
                {past.map((e) => (
                  <li key={e.slug}><span className="muted" style={{ fontFamily: "var(--display)", fontWeight: 500 }}>{longDate(e.date)}</span>
                    <span className="row between"><span className="h3" style={{ fontSize: 20 }}>{e.series} {e.city} <span className="muted" style={{ fontWeight: 400 }}>· {e.venue}</span></span><Link href={`/events/${e.slug}`} style={{ fontSize: 13, fontWeight: 600 }}>View →</Link></span></li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>
      <NewsletterBand title="The next conversation" source="events" />
    </>
  );
}
