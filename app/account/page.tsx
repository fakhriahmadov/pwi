import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { allEvents, isPast, formatEuro } from "@/lib/events";
import { longDate, weekday } from "@/lib/format";
import { accentVars } from "@/lib/accent";
import { bgStyle } from "@/lib/image-specs";
import { FREQUENCIES, TOPICS, frequencyLabel, topicLabel, nextDue, currentDue } from "@/lib/newsletter";
import { cancelRegistration, transferRegistration, withdrawRequest, saveNewsletter, saveProfile, changePassword, deleteAccount } from "./actions";
import s from "./account.module.css";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

const TABS = [["events", "My events"], ["news", "Newsletter"], ["profile", "Profile & security"], ["activity", "Activity"]] as const;
const STATUS: Record<string, string> = { PAID: "Paid", APPROVED: "Approved", PENDING_APPROVAL: "Waiting for approval", PENDING_PAYMENT: "Payment not completed", ENQUIRY: "Enquiry", CANCELLED: "Cancelled" };
const EXPLAIN: Record<string, string> = {
  Paid: "You’re registered. Your e-ticket was emailed to you.",
  Approved: "Your request was approved. Complete payment from the email we sent to receive your ticket.",
  "Waiting for approval": "The institute reviews every request. You’ll hear from us by email within a few days.",
  "Payment not completed": "Your checkout wasn’t completed. Register again from the event page if you’d still like to attend.",
  Enquiry: "We have your enquiry and will be in touch within two working days.",
  Cancelled: "This registration was cancelled.",
  Attended: "Thank you for joining us.",
};
const pill = (st: string) => /Paid|Approved|Attended/.test(st) ? { background: "var(--ink)", color: "var(--paper)" } : /Cancel/.test(st) ? { background: "#FBE9E9", color: "var(--red-dark)" } : { background: "var(--sand-2)", color: "var(--ink-body)" };

export default async function Account({ searchParams }: { searchParams: Promise<{ tab?: string; msg?: string; notice?: string; setup?: string }> }) {
  const sp = await searchParams;
  const me = await currentUser();
  if (!me) redirect("/signin?next=/account");
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : "events";
  const [regs, sub, acts, events] = await Promise.all([
    db.registration.findMany({ where: { email: { equals: me.email, mode: "insensitive" } }, orderBy: { createdAt: "desc" } }),
    db.subscriber.findUnique({ where: { email: me.email } }),
    db.activity.findMany({ where: { email: me.email }, orderBy: { createdAt: "desc" }, take: 100 }),
    allEvents({ includeDrafts: true }),
  ]);
  const ev = new Map(events.map((e) => [e.slug, e]));
  const rows = regs.filter((r) => r.status !== "PENDING_PAYMENT" || Date.now() - r.createdAt.getTime() < 864e5).map((r) => {
    const e = ev.get(r.eventSlug);
    const past = e ? isPast(e) : false;
    const shown = past && r.status === "PAID" ? "Attended" : r.requestType === "cancel" ? "Cancellation requested" : r.requestType === "transfer" ? "Transfer requested" : STATUS[r.status] ?? r.status;
    return { r, e, past, shown };
  });
  const upcoming = rows.filter((x) => !x.past && x.r.status !== "CANCELLED");
  const earlier = rows.filter((x) => x.past || x.r.status === "CANCELLED");
  const active = sub && !sub.unsubscribed;
  const subStatus = !sub ? "Not subscribed" : sub.unsubscribed ? "Unsubscribed" : sub.confirmedAt ? "Subscribed" : "Awaiting confirmation";
  const freq = active ? sub!.frequency : "monthly";
  const topics = active ? sub!.topics : ["insights", "events"];
  const first = (me.name || me.email).split(/[\s@]/)[0];
  const isAdmin = me.role === "admin";
  const tabsHref = (k: string) => `/account?tab=${k}`;
  const linkBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 14, fontWeight: 500, color: "var(--ink)", textUnderlineOffset: 3 };

  return (
    <div className={s.page}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "clamp(32px,6vw,64px) clamp(16px,4vw,32px) 96px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <span className={s.eyebrow}>My account · {isAdmin ? "Admin" : "Member"}</span>
            <h1 className={s.disp} style={{ fontSize: "clamp(34px,7vw,60px)", lineHeight: 1 }}>Hello, {first}<span className="dot">.</span></h1>
            <p style={{ margin: 0, color: "var(--ink-body)", fontSize: 14, overflowWrap: "anywhere" }}>{me.email} · member since {longDate(me.createdAt.toISOString().slice(0, 10))}</p>
          </div>
          <form method="post" action="/api/auth/logout"><button className={`${s.btn} ${s.btnGhost}`}>Sign out</button></form>
        </div>

        {sp.notice === "admin-only" && <p className={s.note} role="status">That page is for the institute’s team only.</p>}
        {isAdmin && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", background: "var(--ink)", color: "var(--paper)" }}>
            <span style={{ fontSize: 14 }}>You also have <b style={{ fontWeight: 600 }}>admin access</b> — events, insights, newsletter and people.</span>
            <Link href="/admin" style={{ color: "var(--paper)", fontSize: 14, fontWeight: 500 }}>Open the admin area →</Link>
          </div>
        )}

        <nav className={s.tabs} aria-label="Account sections">
          {TABS.map(([k, l]) => <Link key={k} href={tabsHref(k)} aria-current={tab === k ? "page" : undefined} className={s.tabLink}>{l}{k === "events" && regs.length ? ` (${rows.length})` : ""}</Link>)}
        </nav>

        {sp.msg && <p className={s.note} role="status">{sp.msg}</p>}
        {sp.setup && <p className={s.note} role="status">You’re signed in. Choose your own password below if you like.</p>}

        {tab === "events" && (
          <>
            {rows.length === 0 && (
              <div className={s.card}><h2 className={s.disp} style={{ fontSize: 26 }}>No registrations yet</h2><p style={{ margin: 0, color: "var(--ink-body)" }}>When you register for a summit with {me.email}, it appears here with your ticket.</p><Link className={`${s.btn} ${s.btnDark}`} href="/events" style={{ alignSelf: "flex-start" }}>See upcoming events</Link></div>
            )}
            {[["Upcoming", upcoming], ["Past & cancelled", earlier]].map(([title, list]) => (list as typeof rows).length > 0 && (
              <section key={String(title)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h2 className={s.eyebrow} style={{ margin: "8px 0 0" }}>{String(title)}</h2>
                {(list as typeof rows).map(({ r, e, past, shown }) => {
                  const photo = e?.cardPhoto || e?.photo;
                  const tt = r.transferTo as { name?: string; email?: string } | null;
                  const canAct = !past && !r.requestType;
                  return (
                    <article key={r.id} className={s.evcard} style={{ ...accentVars(e?.accent), boxShadow: "inset 4px 0 0 var(--acc)" }}>
                      <div className={s.evimg} style={photo ? { backgroundColor: "var(--sand-2)", ...bgStyle(photo) } : { background: "var(--acc)" }} role="img" aria-label={e?.city ?? ""} />
                      <div className={s.evbody}>
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "8px 16px", alignItems: "flex-start" }}>
                          <div style={{ minWidth: 0 }}><span className={s.eyebrow}>{e?.series ?? "Event"}</span><h3 className={s.disp} style={{ fontSize: "clamp(26px,4vw,36px)", lineHeight: 1.05, margin: 0 }}>{e?.city ?? r.eventSlug}<span style={{ color: "var(--acc-ink)" }}>.</span></h3></div>
                          <span className={s.pill} style={pill(shown)}>{shown}</span>
                        </div>
                        <dl className={s.facts}>
                          <div><dt>Date</dt><dd>{e ? `${weekday(e.date)}, ${longDate(e.date)}` : "—"}</dd></div>
                          <div><dt>Venue</dt><dd>{e?.venue || "To be announced"}</dd></div>
                          <div><dt>Pass</dt><dd>{r.passName}{r.quantity > 1 ? ` × ${r.quantity}` : ""}</dd></div>
                          <div><dt>Amount</dt><dd>{r.amountCents ? formatEuro(r.amountCents) : "On request"}</dd></div>
                        </dl>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--ink-body)" }}>
                          {r.requestType === "cancel" ? "You asked to cancel. The team will confirm and refund according to the terms."
                            : r.requestType === "transfer" ? `You asked to transfer this pass to ${tt?.name ?? "a colleague"}${tt?.email ? ` (${tt.email})` : ""}. The team will confirm by email.`
                            : EXPLAIN[shown] ?? ""}
                        </p>
                        <div className={s.acts}>
                          {e && !past && <Link href={`/events/${e.slug}`} style={linkBtn}>Event page</Link>}
                          {r.ticketCode && !past && r.status === "PAID" && <Link className={`${s.btn} ${s.btnDark}`} href={`/tickets/${r.ticketCode}`}>Show ticket</Link>}
                          {e && !past && r.status === "PAID" && <a href={`/events/${e.slug}/calendar.ics`} style={linkBtn}>Add to calendar</a>}
                          {r.requestType && !past && <form action={withdrawRequest}><input type="hidden" name="id" value={r.id} /><button className={s.btnText}>Withdraw my request</button></form>}
                        </div>
                        {canAct && r.status === "PAID" && (
                          <details className={s.more}>
                            <summary>Transfer to a colleague</summary>
                            <form action={transferRegistration} className={s.inline}>
                              <input type="hidden" name="id" value={r.id} />
                              <div className={s.row}>
                                <div className={s.fld}><label htmlFor={`tn-${r.id}`}>Their full name</label><input id={`tn-${r.id}`} name="name" required /></div>
                                <div className={s.fld}><label htmlFor={`te-${r.id}`}>Their email</label><input id={`te-${r.id}`} name="email" type="email" required /></div>
                              </div>
                              <button className={`${s.btn} ${s.btnDark}`} style={{ alignSelf: "flex-start" }}>Send transfer request</button>
                            </form>
                          </details>
                        )}
                        {canAct && r.status !== "CANCELLED" && (
                          <details className={s.more}>
                            <summary className={s.danger}>{r.status === "PAID" || r.status === "APPROVED" ? "Request cancellation" : "Withdraw"}</summary>
                            <form action={cancelRegistration} className={s.inline} style={{ background: "#FBE9E9" }}>
                              <input type="hidden" name="id" value={r.id} />
                              <span style={{ fontSize: 14 }}>{r.status === "PAID" ? "The team confirms every cancellation and refunds according to the event terms. You can also transfer the pass to a colleague instead." : "You can register again later while places are available."}</span>
                              <button className={`${s.btn} ${s.btnDark}`} style={{ alignSelf: "flex-start" }}>{r.status === "PAID" || r.status === "APPROVED" ? "Request cancellation" : "Withdraw"}</button>
                            </form>
                          </details>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            ))}
          </>
        )}

        {tab === "news" && (
          <form action={saveNewsletter} className={s.card}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "8px 16px", alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}><h2 className={s.disp} style={{ fontSize: "clamp(24px,4vw,32px)", lineHeight: 1.1 }}>The PWI newsletter</h2>
                <p style={{ margin: "4px 0 0", color: "var(--ink-body)", fontSize: 14 }}>{active && sub!.confirmedAt ? `${frequencyLabel(sub!.frequency)} · ${sub!.topics.map(topicLabel).join(" and ")}. Next edition: ${longDate(nextDue(sub!.frequency as never, currentDue(sub!.frequency as never)))}.` : "Research, index updates and upcoming events in one email, as often as you like."}</p></div>
              <span className={s.pill} style={pill(subStatus === "Subscribed" ? "Paid" : subStatus === "Unsubscribed" ? "Cancelled" : "")}>{subStatus}</span>
            </div>
            <span className={s.eyebrow}>How often</span>
            <div className={s.seg} role="radiogroup">{FREQUENCIES.map((f) => <label key={f.id} className={s.segOpt}><input type="radio" name="frequency" value={f.id} defaultChecked={freq === f.id} /><span>{f.label}</span></label>)}</div>
            <span className={s.eyebrow}>What to include</span>
            <div className={s.row}>{TOPICS.map((t) => <label key={t.id} className={s.tile} style={{ flex: "1 1 min(260px, 100%)" }}><input type="checkbox" name="topics" value={t.id} defaultChecked={topics.includes(t.id)} /><span><b style={{ display: "block", fontWeight: 500 }}>{t.label}</b><span style={{ color: "var(--ink-muted)", fontSize: 13 }}>{t.hint}</span></span></label>)}</div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>Event news only ever arrives inside the newsletter — never as separate invitations.</p>
            <div className={s.acts}>
              <button className={`${s.btn} ${s.btnDark}`} name="intent" value="save">{active ? "Save changes" : "Subscribe"}</button>
              {active && <button className={`${s.btnText} ${s.danger}`} name="intent" value="unsubscribe">Unsubscribe</button>}
            </div>
          </form>
        )}

        {tab === "profile" && (
          <>
            <form action={saveProfile} className={s.card}>
              <h2 className={s.disp} style={{ fontSize: "clamp(24px,4vw,32px)" }}>Your details</h2>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ink-body)" }}>We use these to fill in summit registrations for you.</p>
              <div className={s.row}>
                <div className={s.fld}><label htmlFor="p-name">Full name</label><input id="p-name" name="name" autoComplete="name" defaultValue={me.name} required /></div>
                <div className={s.fld}><label htmlFor="p-email">Email address</label><input id="p-email" readOnly value={me.email} /></div>
              </div>
              <div className={s.row}>
                <div className={s.fld}><label htmlFor="p-company">Company</label><input id="p-company" name="company" autoComplete="organization" defaultValue={me.company ?? ""} /></div>
                <div className={s.fld}><label htmlFor="p-title">Role</label><input id="p-title" name="title" autoComplete="organization-title" defaultValue={me.title ?? ""} /></div>
                <div className={s.fld}><label htmlFor="p-phone">Phone · optional</label><input id="p-phone" name="phone" type="tel" autoComplete="tel" defaultValue={me.phone ?? ""} /></div>
              </div>
              <div className={s.acts}><button className={`${s.btn} ${s.btnDark}`}>Save details</button><span style={{ fontSize: 13, color: "var(--ink-muted)" }}>To change your email address, write to info@privatewealth.institute.</span></div>
            </form>
            <form action={changePassword} className={s.card}>
              <h2 className={s.disp} style={{ fontSize: "clamp(24px,4vw,32px)" }}>Sign-in &amp; security</h2>
              <dl className={s.facts}>
                <div><dt>Last signed in with</dt><dd>{me.method === "link" ? "Email link" : me.method === "google" ? "Google" : me.method === "password" ? "Password" : "—"}</dd></div>
                <div><dt>Last sign-in</dt><dd>{me.lastSignIn ? longDate(me.lastSignIn.toISOString().slice(0, 10)) : "—"}</dd></div>
                <div><dt>Access</dt><dd>{isAdmin ? "Admin" : "Member"}</dd></div>
              </dl>
              <div className={s.row}><div className={s.fld}><label htmlFor="pw-new">New password · at least 10 characters</label><input id="pw-new" name="password" type="password" autoComplete="new-password" minLength={10} required /></div></div>
              <button className={`${s.btn} ${s.btnGhost}`} style={{ alignSelf: "flex-start" }}>Change password</button>
            </form>
            {!isAdmin && (
              <div className={s.card}>
                <h2 className={s.disp} style={{ fontSize: "clamp(24px,4vw,32px)" }}>Your data</h2>
                <details className={s.more}>
                  <summary className={s.danger}>Delete my account</summary>
                  <form action={deleteAccount} className={s.inline} style={{ background: "#FBE9E9" }}>
                    <span style={{ fontSize: 14 }}>You’ll be signed out and unsubscribed. Paid registrations stay on file for invoicing, and your tickets remain valid.</span>
                    <button className={`${s.btn} ${s.btnDark}`} style={{ alignSelf: "flex-start" }}>Delete my account</button>
                  </form>
                </details>
              </div>
            )}
          </>
        )}

        {tab === "activity" && (
          <div className={s.card}>
            <h2 className={s.disp} style={{ fontSize: "clamp(24px,4vw,32px)" }}>Activity</h2>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ink-body)" }}>Everything you’ve changed: registrations, requests, newsletter and settings.</p>
            <ul className={s.log}>{acts.map((a) => <li key={a.id}><span style={{ color: "var(--ink-muted)" }}>{longDate(a.createdAt.toISOString().slice(0, 10))}</span><span>{a.text}</span></li>)}</ul>
            {acts.length === 0 && <p style={{ margin: 0, color: "var(--ink-muted)" }}>Nothing yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
