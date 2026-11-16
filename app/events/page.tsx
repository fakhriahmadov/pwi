import type { Metadata } from "next";
import Link from "next/link";
import { upcomingEvents, pastEvents } from "@/lib/events";
import { longDate, monthYear, weekday, dayOfMonth } from "@/lib/format";
import { accentVars } from "@/lib/accent";
import { bgStyle } from "@/lib/image-specs";
import { getContent } from "@/lib/content";
import s from "./events.module.css";

export const metadata: Metadata = { title: "Events", description: "Future. Summit — private conversations on how we live, build businesses and shape wealth." };
export const revalidate = 300;

const WORDS = ["No summits", "One summit", "Two summits", "Three summits", "Four summits", "Five summits"];

export default async function Events() {
  const c = await getContent("events");
  const up = await upcomingEvents();
  const past = await pastEvents();
  const n = up[0];
  return (
    <>
      <section className={s.hero}>
        <div className={s.wrap}>
          <div>
            <h1>Events<span className={s.dot}>.</span></h1>
            <p className={s.tagline}>{String(c.lead || "Private conversations on how we live, build businesses and shape wealth — in the places that set the tone.")}</p>
          </div>
          <div className={s.facts}>
            <div className={s.fact}><span className={s.factLabel}>Next event</span><a className={s.factMain} href="#upcoming">{n ? `${n.series.replace(/\.$/, "")} ${n.city}` : "To be announced"}</a><span className={s.factSub}>{n ? `${longDate(n.date)} · ${n.venue || "Venue to be announced"}` : "New dates coming soon"}</span></div>
            <div className={s.fact}><span className={s.factLabel}>Upcoming</span><span className={s.factMain}>{WORDS[up.length] ?? `${up.length} summits`}</span><span className={s.factSub}>{up.map((e) => e.city).join(" · ") || "Dates announced soon"}</span></div>
            <div className={`${s.fact} ${s.factFormat}`}><span className={s.factLabel}>Format</span><span className={s.factMain}>{String(c.formatTitle || "One-day summits")}</span><span className={s.factSub}>{String(c.formatText || "Panels, networking and evening programmes")}</span></div>
          </div>
        </div>
      </section>

      <section id="upcoming">
        <div className={s.wrap}>
          <div className={s.listHead}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><span className={s.kicker}>Calendar</span><h2 className={s.h2x}>Upcoming events</h2></div>
            <span className={s.count}>{up.length} {up.length === 1 ? "event" : "events"}</span>
          </div>
          <ol className={s.evs}>
            {up.map((e) => {
              const ext = e.externalRegistrationUrl;
              const canReg = e.registration !== "closed";
              const photo = e.cardPhoto || e.photo;
              return (
                <li key={e.slug} className={s.ev} style={accentVars(e.accent)}>
                  <span className={s.edge} aria-hidden="true" />
                  <div className={s.date}><span className={s.day}>{dayOfMonth(e.date)}</span><span><span className={s.month}>{monthYear(e.date)}</span><span className={s.week}>{weekday(e.date)}</span></span></div>
                  <div className={s.body}>
                    <span className={s.series}>{e.series}</span>
                    <h3 className={s.city}>{e.city}<span style={{ color: "var(--acc-ink)" }}>.</span></h3>
                    <div><div className={s.venue}>{e.venue || "Venue to be announced"}</div><div className={s.addr}>{e.address}</div></div>
                    <p className={s.desc}>{e.description}</p>
                    {e.tags.length > 0 && <div className={s.tags}>{e.tags.map((t) => <span key={t} className={s.tag}>{t}</span>)}</div>}
                    <div className={s.actions}>
                      <Link className={`${s.xbtn} ${s.accBtn}`} href={`/events/${e.slug}`}>Event page →</Link>
                      {canReg && (ext
                        ? <a className={`${s.xbtn} ${s.ghost}`} href={ext} target="_blank" rel="noopener">Register</a>
                        : <Link className={`${s.xbtn} ${s.ghost}`} href={`/events/${e.slug}/register`}>{e.registration === "approval" ? "Request invitation" : "Register"}</Link>)}
                    </div>
                  </div>
                  <Link className={s.photo} href={`/events/${e.slug}`} aria-label={`${e.city} event page`} style={bgStyle(photo)} />
                </li>
              );
            })}
            {up.length === 0 && <li className={s.soon}>New dates will be announced soon.</li>}
          </ol>
        </div>
      </section>

      {past.length > 0 && (
        <section id="past">
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(56px,6vw,96px) clamp(16px,4vw,32px)", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><span className={s.kicker}>Archive</span><h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(28px,6vw,56px)", lineHeight: 1, letterSpacing: "-.035em" }}>Past events</h2></div>
            <div style={{ borderTop: "1px solid var(--line)" }}>
              {past.map((e) => (
                <Link key={e.slug} href={`/events/${e.slug}`} className={s.pastRow}>
                  <span className={s.pastCity}>{e.city} <span style={{ color: "var(--ink-subtle)" }}>{e.date.slice(0, 4)}</span></span>
                  <span style={{ fontSize: 14, color: "var(--ink-muted)" }}>{longDate(e.date)} · {e.venue}{e.tags.length ? ` · ${e.tags.join(" · ")}` : ""}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={s.band}>
        <div className={s.bandIn}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}><span className={s.kicker}>Stay informed</span><h2 className={s.bandTitle}>The next conversation<span className={s.dot}>.</span></h2><p style={{ margin: 0, color: "var(--ink-body)", maxWidth: "48ch" }}>New dates and programmes arrive in the newsletter — choose how often you hear from us.</p></div>
          <Link className={`${s.xbtn} ${s.redBtn}`} href="/insights#newsletter">Subscribe →</Link>
        </div>
      </section>
    </>
  );
}
