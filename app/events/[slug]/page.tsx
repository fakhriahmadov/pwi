import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allEvents, getEvent, isPast, passPriceLabel, upcomingEvents } from "@/lib/events";
import { longDate, weekday, monthYear, dayOfMonth } from "@/lib/format";
import { accentVars } from "@/lib/accent";
import type { SummitEvent } from "@/content/events";
import { ThemeCards } from "./ThemeCards";
import s from "./summit.module.css";

type P = { params: Promise<{ slug: string }> };
export async function generateStaticParams() { return (await allEvents()).map((e) => ({ slug: e.slug })); }
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  return e ? { title: `${e.series} ${e.city}`, description: e.tagline || e.description } : {};
}

const WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
const DEFAULT_THEMES = [
  { title: "How we will live", text: "Lifestyle, status, longevity, home and the experiences that define a new generation of wealth." },
  { title: "How we build businesses", text: "The entrepreneurial mindset, rewired — and the family enterprises carrying legacy into the next century." },
  { title: "How we shape wealth", text: "The fluidity of capital across borders, generations and asset classes — and style as a form of capital itself." },
];

function registration(e: SummitEvent) {
  const ext = e.externalRegistrationUrl;
  return ext ? { href: ext, external: true } : { href: `/events/${e.slug}/register`, external: false };
}
function RegLink({ e, className, children }: { e: SummitEvent; className: string; children: React.ReactNode }) {
  const r = registration(e);
  return r.external ? <a className={className} href={r.href} target="_blank" rel="noopener">{children}</a> : <Link className={className} href={r.href}>{children}</Link>;
}

export default async function EventPage({ params }: P) {
  const e = await getEvent((await params).slug);
  if (!e) notFound();
  const past = isPast(e);
  const canRegister = !past && e.registration !== "closed" && (e.passes.length > 0 || !!e.externalRegistrationUrl);
  const next = (await upcomingEvents()).find((x) => x.slug !== e.slug);
  const [titleA, ...rest] = (e.series || "Future. Summit").split(".");
  const titleB = rest.join(".");
  const byKey = new Map<string, SummitEvent["speakers"][number]>();
  for (const sp of e.speakers) { if (sp.id) byKey.set(sp.id, sp); byKey.set(sp.name, sp); }
  // Count only conversations with speakers; placeholder rows ("Conversations 1–5") fall back to the event's highlights.
  const n = e.programme.filter((p) => !p.isBreak && (p.speakers?.length ?? 0) > 0).length;
  const progMain = n ? `${n} ${n === 1 ? "conversation" : "conversations"}` : e.tags[0] || "One-day summit";
  const progSub = e.eveningTitle ? `Followed by ${e.eveningTitle}` : e.startTime ? `Doors open ${e.startTime}` : "Times announced soon";
  const prev = (e.previous || []).filter((p) => p.name);
  const partners = (e.partners || []).filter((p) => p.name);
  const label = e.registration === "approval" ? "Request an invitation" : "Register as an attendee";
  const venue = e.venue || "Venue to be announced";
  const menu = [["About", "#about"], ["Programme", "#programme"], ...(prev.length ? [["Previous speakers", "#speakers"]] : []), ["Venue", "#venue"], ...(partners.length ? [["Partners", "#partners"]] : [])];
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Event", name: `${e.series} ${e.city}`, startDate: e.startTime ? `${e.date}T${e.startTime}` : e.date,
    eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", description: e.description,
    location: { "@type": "Place", name: e.venue, address: e.address }, organizer: { "@type": "Organization", name: "Private Wealth Institute" },
  };

  return (
    <div style={accentVars(e.accent)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className={s.hero} style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className={s.wrap}>
          <div>
            <h1>{titleA}<span style={{ color: "var(--acc-ondark)" }}>.</span>{titleB}</h1>
            <div className={s.heroSub}>
              <p className={s.tagline}>{e.tagline || "A conversation about how we will live, build businesses and shape wealth in a changing world."}</p>
              <div className={s.btns}>
                {canRegister && <RegLink e={e} className={`${s.xbtn} ${s.xbtnPrimary}`}>{label}</RegLink>}
                {past && <span className={s.xbtn} style={{ background: "var(--ink-line)", color: "var(--stone)" }}>This summit has taken place</span>}
                <a className={`${s.xbtn} ${s.xbtnGhost}`} href="#programme">The programme</a>
              </div>
            </div>
          </div>
          <div className={s.facts}>
            <div className={s.fact}><span className={s.factLabel}>Date</span><div className={s.date}><span className={s.dateDay}>{dayOfMonth(e.date)}</span><span className={s.stack8} style={{ gap: 2 }}><span className={s.dateMonth}>{monthYear(e.date).split(" ")[0]}</span><span className={s.dateWeek}>{weekday(e.date)} · {e.date.slice(0, 4)}</span></span></div></div>
            <div className={s.fact}><span className={s.factLabel}>Venue</span><a href="#venue"><span className={s.stack8} style={{ gap: 4 }}><span className={s.factMain}>{venue}</span><span className={s.factSub}>{e.address}</span></span></a></div>
            <div className={s.fact}><span className={s.factLabel}>Programme</span><a href="#programme"><span className={s.stack8} style={{ gap: 4 }}><span className={s.factMain}>{progMain}</span><span className={s.factSub}>{progSub}</span></span></a></div>
          </div>
          {canRegister && <RegLink e={e} className={`${s.xbtn} ${s.xbtnPrimary} ${s.heroRegMobile}`}>{label}</RegLink>}
          {!past && <a href={`/events/${e.slug}/calendar.ics`} style={{ alignSelf: "flex-start", fontSize: 13, color: "var(--stone-2)" }}>Add to calendar</a>}
        </div>
      </section>

      <nav className={s.subnav} aria-label="On this page">
        <div className={s.wrap}>
          {menu.map(([l, h]) => <a key={h} href={h}>{l}</a>)}
          {canRegister && <RegLink e={e} className={s.cta}>Register →</RegLink>}
        </div>
      </nav>

      <section id="about">
        <div className={s.wrap}>
          <div className={s.aboutTop}><span className={s.kicker}>The conversation</span><h2>{e.description}</h2></div>
          <ThemeCards themes={e.themes?.length ? e.themes : DEFAULT_THEMES} />
        </div>
      </section>

      <section id="programme" className={s.lightbg}>
        <div className={s.wrap}>
          <div className={s.headRow}><div className={s.stack8}><span className={s.kicker}>Programme</span><h2 className={s.h2x}>{n ? `${WORDS[n] || n} ${n === 1 ? "conversation" : "conversations"}. One day.` : "The day."}</h2></div><span className={s.datePill}>{weekday(e.date)} · {longDate(e.date)}</span></div>
          <ol className={s.panels}>
            {e.programme.map((p, i) => {
              if (p.isBreak) return <li key={i} className={s.brk}><span className={s.brkTime}>{p.time}</span><span className={s.brkTitle}>{p.title}</span>{p.detail && <span className={s.brkDetail}>{p.detail}</span>}</li>;
              const sps = (p.speakers || []).map((k) => byKey.get(k)).filter((sp): sp is NonNullable<typeof sp> => !!sp && !sp.tbc);
              return (
                <li key={i} className={s.panel}>
                  <div className={s.panelLeft}><span className={s.panelTime}>{p.time || "·"}</span><h3 className={s.panelTitle}>{p.title}</h3>{p.detail && <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{p.detail}</span>}</div>
                  <div className={s.panelSpeakers}>
                    {sps.map((sp) => (
                      <div key={sp.name} className={s.spRow}>
                        {sp.photo && <span className={s.spPh} style={{ backgroundImage: `url(${sp.photo})` }} role="img" aria-label={sp.name} />}
                        <div><div className={s.spName}>{sp.name}</div><div className={s.spTitle}>{sp.title}</div></div>
                      </div>
                    ))}
                    {!sps.length && <div className={s.spTba}>Speakers to be announced</div>}
                  </div>
                </li>
              );
            })}
            {e.eveningTitle && <li className={s.evening}><span className={s.eveningTime}>{e.eveningTime}</span><div className={s.eveningBody}><span className={s.eveningTitle}>{e.eveningTitle}</span>{e.eveningLocation && <span className={s.eveningLoc}>{e.eveningLocation}</span>}</div></li>}
          </ol>
        </div>
      </section>

      {prev.length > 0 && (
        <section id="speakers">
          <div className={s.wrap}>
            <div className={s.stack8}><span className={s.kicker}>Previous speakers</span><h2 className={s.h2x}>Voices from the table</h2></div>
            <div className={s.prevGrid}>
              {prev.map((p) => (
                <div key={p.name} className={s.prev}>
                  <div className={s.prevPhoto} style={p.photo ? { backgroundImage: `url(${p.photo})` } : undefined} role="img" aria-label={p.name} />
                  <div><div className={s.gName}>{p.name}</div><div className={s.gTitle}>{p.title}</div></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="venue" className={s.venue}>
        <div className={s.wrap}>
          <div className={s.venuePhoto} style={e.photo ? { backgroundImage: `url(${e.photo})` } : undefined} role="img" aria-label={venue} />
          <div className={s.venueInfo}>
            <span className={s.kicker}>The venue</span>
            <h2 className={s.venueCity}>{e.city}<span style={{ color: "var(--acc-ondark)" }}>.</span></h2>
            <div><div className={s.venueHotel}>{venue}</div><div className={s.venueAddr}>{e.address}</div></div>
            {e.venueDesc && <p className={s.venueDesc}>{e.venueDesc}</p>}
            <div className={s.venueMeta}><span>Date</span><span>{longDate(e.date)}</span></div>
            <div className={s.btns}>
              {e.cityGuide && <a className={`${s.xbtn} ${s.xbtnPrimary}`} href={e.cityGuide} target="_blank" rel="noopener">Discover {e.city} →</a>}
              {e.mapsUrl && <a className={`${s.xbtn} ${s.xbtnGhost}`} href={e.mapsUrl} target="_blank" rel="noopener">View on map</a>}
            </div>
          </div>
        </div>
      </section>

      {partners.length > 0 && (
        <section id="partners">
          <div className={s.wrap} style={{ display: "flex", flexDirection: "column", gap: "clamp(24px,3vw,36px)" }}>
            <div className={s.headRow}><div className={s.stack8}><span className={s.kicker}>Organising partners</span><h2 className={s.h2x}>In partnership with</h2></div><a className={s.partnerLink} href={`mailto:${e.email || "info@privatewealth.institute"}?subject=${encodeURIComponent(`${e.series} ${e.city} — Partnership`)}`}>Partnership opportunities →</a></div>
            <div className={s.partnerGrid}>
              {partners.map((p) => (
                <a key={p.name} className={s.partner} href={p.link || "#"} target="_blank" rel="noopener">
                  {p.logo ? <span className={s.partnerLogo} style={{ backgroundImage: `url(${p.logo})` }} role="img" aria-label={p.name} /> : <span>{p.name}</span>}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="register" className={s.register}>
        <div className={s.wrap}>
          <div className={s.regTop}>
            <div className={s.stack8} style={{ gap: 16 }}><span className={s.regLabel} style={{ letterSpacing: ".14em", fontSize: 12 }}>{past ? "Thank you" : "Attend"}</span><h2 className={s.regTitle}>{past ? `See you at the next summit` : `Join us in ${e.city}`}<span style={{ color: "var(--acc-ink)" }}>.</span></h2></div>
            <div className={s.regCta}>
              <p className={s.regText}>{past ? `${e.series} ${e.city} took place on ${longDate(e.date)}.` : e.regText || `Register for a full day of conversations with founders, family principals and investors${e.eveningTitle ? ` — followed by ${e.eveningTitle}.` : "."}`}</p>
              {canRegister && <RegLink e={e} className={`${s.xbtn} ${s.xbtnPrimary} ${s.regBtn}`}>{label} →</RegLink>}
              {past && next && <Link className={`${s.xbtn} ${s.xbtnPrimary} ${s.regBtn}`} href={`/events/${next.slug}`}>{next.series} {next.city} →</Link>}
              {e.email && <p className={s.regMail}>Questions? <a href={`mailto:${e.email}`}>{e.email}</a></p>}
            </div>
          </div>
          {canRegister && !e.externalRegistrationUrl && (
            <div className={s.passGrid}>
              {e.passes.map((p) => (
                <div key={p.id} style={{ ...(p.featured ? { background: "var(--acc)", color: "var(--acc-fg)" } : { background: "var(--paper)" }), padding: "clamp(22px,3vw,30px)", display: "flex", flexDirection: "column", gap: 12 }}>
                  {p.featured && <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".32em", textTransform: "uppercase" }}>Most chosen</span>}
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 300, letterSpacing: "-.04em" }}>{passPriceLabel(p)}</span>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>{p.includes.map((x) => <li key={x}>{x}</li>)}</ul>
                  <Link className={`${s.btn} ${p.featured ? s.btnWhite : s.btnDark}`} href={p.onRequest ? "/contact?topic=partner" : `/events/${e.slug}/register?pass=${p.id}`} style={{ marginTop: "auto" }}>{p.onRequest ? "Talk to us" : "Select"}</Link>
                </div>
              ))}
            </div>
          )}
          <div className={s.regFacts}>
            <div className={s.regFact}><span className={s.regLabel}>Date</span><span className={s.regMain}>{longDate(e.date)}</span><span className={s.regSub}>{weekday(e.date)}</span></div>
            <div className={s.regFact}><span className={s.regLabel}>Venue</span><span className={s.regMain}>{venue}</span><span className={s.regSub}>{e.address}</span></div>
            <div className={s.regFact}><span className={s.regLabel}>Programme</span><span className={s.regMain}>{progMain}</span><span className={s.regSub}>{progSub}</span></div>
          </div>
        </div>
      </section>

      {e.faq.length > 0 && (
        <section id="faq" className={s.faq}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(64px,7vw,112px) clamp(16px,4vw,32px)", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}><span className={s.kicker}>Good to know</span><h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(28px,6vw,56px)", lineHeight: 1, letterSpacing: "-.035em" }}>Questions</h2></div>
            <div style={{ borderTop: "1px solid var(--line)" }}>
              {e.faq.map((q) => (
                <details key={q.q} style={{ borderBottom: "1px solid var(--line)" }}>
                  <summary style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, minHeight: 64, fontFamily: "var(--font-display)", fontSize: "clamp(17px,2vw,20px)", fontWeight: 500 }}>{q.q}<span className={s.fplus} aria-hidden="true" /></summary>
                  <p style={{ margin: "0 0 20px", color: "var(--ink-body)", maxWidth: "64ch" }}>{q.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {next && !past && (
        <section style={{ background: "var(--sand-2)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(48px,5vw,80px) clamp(16px,4vw,32px)", boxSizing: "border-box", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase" }}>Next · {longDate(next.date)}</span><span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px,12vw,120px)", lineHeight: .85, letterSpacing: "-.055em" }}>{next.city}.</span></div>
            <Link className={`${s.btn} ${s.btnDark}`} href={`/events/${next.slug}`}>See {next.city} →</Link>
          </div>
        </section>
      )}
    </div>
  );
}
