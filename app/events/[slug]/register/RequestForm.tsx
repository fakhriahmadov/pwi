"use client";
import { useEffect, useState } from "react";
import { longDate, weekday } from "@/lib/format";

type Ev = { slug: string; city: string; date: string; venue: string; address: string; accent: string; email?: string };

const COUNTRY_HINTS = ["Austria", "Belgium", "France", "Germany", "Greece", "Italy", "Luxembourg", "Monaco", "Netherlands", "Portugal", "Spain", "Switzerland", "United Arab Emirates", "United Kingdom", "United States"];

/** Request an invitation: details only — no passes, no prices. The team reviews every request in Admin → Registrations. */
export function RequestForm({ event }: { event: Ev }) {
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", role: "", country: "", linkedin: "", guests: "1", message: "", heardFrom: "Invitation from the institute", marketingOptIn: false, consent: false, website: "" });
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [signedIn, setSignedIn] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  // Signed-in members: fill in what we already know.
  useEffect(() => {
    fetch("/api/me", { cache: "no-store" }).then((r) => r.json()).then((m) => {
      if (!m) return;
      setSignedIn(m.email);
      const [first, ...rest] = String(m.name || "").split(" ");
      setF((x) => ({ ...x, firstName: x.firstName || first || "", lastName: x.lastName || rest.join(" "), email: x.email || m.email, company: x.company || m.company || "", role: x.role || m.title || "", phone: x.phone || m.phone || "" }));
    }).catch(() => {});
  }, []);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setErr(null);
    if (!f.firstName.trim() || !f.lastName.trim() || !/\S+@\S+\.\S+/.test(f.email)) return setErr("Please fill in your first name, surname and a valid email address.");
    if (!f.consent) return setErr("Please agree to the terms and privacy policy.");
    setSending(true);
    try {
      const res = await fetch("/api/invitation-request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, guests: Number(f.guests), eventSlug: event.slug }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.redirect) { setErr(json.message || "Something went wrong. Please try again."); setSending(false); return; }
      window.location.href = json.redirect;
    } catch { setErr("We couldn't reach the server. Check your connection and try again."); setSending(false); }
  }

  return (
    <div className="row" style={{ ["--g" as string]: "24px", alignItems: "flex-start" }}>
      <form onSubmit={submit} noValidate className="stack min0" style={{ flex: "2 1 min(560px, 100%)", background: "var(--paper)", padding: "clamp(24px,3vw,48px)", ["--g" as string]: "28px" }}>
        <div className="stack" style={{ ["--g" as string]: "18px" }}>
          <h2 className="h3" style={{ fontSize: 28 }}>About you</h2>
          {signedIn
            ? <p className="notice">Filled in from your account ({signedIn}). You’ll find this request under <a href="/account">My account</a>.</p>
            : <p className="muted" style={{ fontSize: 14 }}>Already have an account? <a href="/signin">Sign in</a> to fill this in for you.</p>}
          <div className="row" style={{ ["--g" as string]: "16px" }}>
            <div className="field"><label htmlFor="fn">First name *</label><input id="fn" className="input" autoComplete="given-name" value={f.firstName} onChange={set("firstName")} required /></div>
            <div className="field"><label htmlFor="ln">Surname *</label><input id="ln" className="input" autoComplete="family-name" value={f.lastName} onChange={set("lastName")} required /></div>
          </div>
          <div className="row" style={{ ["--g" as string]: "16px" }}>
            <div className="field"><label htmlFor="em">Email *</label><input id="em" type="email" className="input" autoComplete="email" value={f.email} onChange={set("email")} required /></div>
            <div className="field"><label htmlFor="ph">Phone</label><input id="ph" type="tel" className="input" autoComplete="tel" value={f.phone} onChange={set("phone")} /></div>
          </div>
          <div className="row" style={{ ["--g" as string]: "16px" }}>
            <div className="field"><label htmlFor="co">Company / family office</label><input id="co" className="input" autoComplete="organization" value={f.company} onChange={set("company")} /></div>
            <div className="field"><label htmlFor="ro">Position</label><input id="ro" className="input" autoComplete="organization-title" value={f.role} onChange={set("role")} /></div>
          </div>
          <div className="row" style={{ ["--g" as string]: "16px" }}>
            <div className="field"><label htmlFor="cy">Country of residence</label><input id="cy" className="input" list="country-hints" autoComplete="country-name" value={f.country} onChange={set("country")} />
              <datalist id="country-hints">{COUNTRY_HINTS.map((c) => <option key={c} value={c} />)}</datalist></div>
            <div className="field"><label htmlFor="li">LinkedIn profile (optional)</label><input id="li" className="input" inputMode="url" placeholder="linkedin.com/in/…" value={f.linkedin} onChange={set("linkedin")} /></div>
          </div>
        </div>

        <div className="stack" style={{ ["--g" as string]: "18px", borderTop: "1px solid var(--line)", paddingTop: 28 }}>
          <h2 className="h3" style={{ fontSize: 28 }}>Your request</h2>
          <div className="row" style={{ ["--g" as string]: "16px" }}>
            <div className="field" style={{ flex: "0 1 min(220px, 100%)" }}><label htmlFor="gu">Number of people</label>
              <select id="gu" className="input" value={f.guests} onChange={set("guests")}>{["1", "2", "3", "4"].map((n) => <option key={n} value={n}>{n === "1" ? "Just me" : `${n} people (me + ${Number(n) - 1})`}</option>)}</select></div>
            <div className="field"><label htmlFor="hear">How did you hear about the summit?</label>
              <select id="hear" className="input" value={f.heardFrom} onChange={set("heardFrom")}>{["Invitation from the institute", "Colleague or partner", "LinkedIn", "Press", "Other"].map((o) => <option key={o}>{o}</option>)}</select></div>
          </div>
          <div className="field"><label htmlFor="ms">Why would you like to attend? (optional)</label>
            <textarea id="ms" className="input" rows={4} value={f.message} onChange={set("message")} placeholder="A few words about you and what you hope to take from the day." style={{ minHeight: 110, padding: "12px 14px", resize: "vertical" }} /></div>
          <label className="check"><input type="checkbox" checked={f.marketingOptIn} onChange={set("marketingOptIn")} /><span>Keep me informed about future summits and research.</span></label>
          <label className="check"><input type="checkbox" checked={f.consent} onChange={set("consent")} /><span>I agree to the <a href="/legal/terms" target="_blank">terms</a> and the <a href="/legal/privacy" target="_blank">privacy policy</a>, and that the institute may review my request.</span></label>
          <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set("website")} />
        </div>

        {err && <p className="notice err" role="alert">{err}</p>}
        <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 24, alignItems: "center", ["--g" as string]: "12px 24px" }}>
          <button type="submit" className="btn btn-acc" disabled={sending}>{sending ? "Sending…" : "Send request →"}</button>
          <span className="muted" style={{ fontSize: 13 }}>No payment now. We reply personally within a few working days.</span>
        </div>
      </form>

      <aside aria-label="Summary" className="dark stack" style={{ flex: "1 1 min(300px, 100%)", padding: 32, ["--g" as string]: "16px" }}>
        <span className="label" style={{ color: "var(--stone-2)" }}>Your request</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 40, lineHeight: .95, letterSpacing: "-.04em" }}>{event.city}<span style={{ color: event.accent }}>.</span></span>
        <span style={{ fontSize: 14, color: "var(--stone)" }}>{weekday(event.date)}, {longDate(event.date)}<br />{event.venue}{event.address ? <><br /><span style={{ color: "var(--stone-2)" }}>{event.address}</span></> : null}</span>
        <div className="row between" style={{ borderTop: "1px solid var(--ink-line)", paddingTop: 16 }}><span>Attendance</span><span>By invitation</span></div>
        <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "var(--stone)" }}>
          <li>You send your request.</li>
          <li>Our team reviews it personally.</li>
          <li>If confirmed, your invitation and e-ticket arrive by email.</li>
        </ol>
        <span style={{ fontSize: 12, color: "var(--stone-2)" }}>Questions? {event.email || "info@privatewealth.institute"}</span>
      </aside>
    </div>
  );
}
