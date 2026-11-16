"use client";
import { useId, useState } from "react";
import { FREQUENCIES, TOPICS } from "@/lib/newsletter-options";

const HINTS: Record<string, string> = { weekly: "Every Monday, only when there’s something new", monthly: "On the 1st of each month", quarterly: "Four times a year: January, April, July, October", annually: "Once a year, in December: the year in review" };

type Status = { kind: "idle" | "sending" | "done" | "error"; message?: string };

/**
 * Newsletter sign-up: topics, how often, email, optional name, consent.
 * `tone="dark"` is the boxed version (Insights side panel); `light` sits on sand backgrounds.
 */
export function NewsletterSignup({ source, tone = "dark", title = "The briefing", text = "Research, index updates and upcoming events — in one email, as often as you like." }: { source: string; tone?: "dark" | "light"; title?: string; text?: string }) {
  const id = useId();
  const [topics, setTopics] = useState<string[]>(["insights", "events"]);
  const [freq, setFreq] = useState("monthly");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [withName, setWithName] = useState(false);
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [st, setSt] = useState<Status>({ kind: "idle" });

  const toggle = (t: string) => setTopics((l) => (l.includes(t) ? l.filter((x) => x !== t) : [...l, t]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setSt({ kind: "error", message: "Please enter a valid email address." });
    if (!topics.length) return setSt({ kind: "error", message: "Choose at least one topic." });
    if (!consent) return setSt({ kind: "error", message: "Please tick the box to agree to receive the newsletter." });
    setSt({ kind: "sending" });
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, frequency: freq, topics, consent, source, website: hp }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) return setSt({ kind: "error", message: json.message || "Something went wrong. Please try again." });
      setSt({ kind: "done" });
    } catch { setSt({ kind: "error", message: "We couldn't reach the server. Check your connection and try again." }); }
  }

  const freqLabel = FREQUENCIES.find((f) => f.id === freq)?.label.toLowerCase();
  return (
    <div className={`nl nl-${tone}`} id="newsletter">
      <span className="nl-disc" aria-hidden="true" />
      <div className="nl-in">
        <span className="nl-kicker">Newsletter</span>
        <h2 className="nl-title">{title}<span className="dot">.</span></h2>
        {st.kind === "done" ? (
          <div className="stack" role="status" style={{ ["--g" as string]: "10px" }}>
            <p className="nl-done">Check your inbox.</p>
            <p className="nl-text">We sent a link to <b>{email}</b>. Once you confirm, the {freqLabel} briefing starts. Event news only ever arrives inside it — never as separate invitations.</p>
          </div>
        ) : (
          <form className="stack" style={{ ["--g" as string]: "18px" }} onSubmit={submit} noValidate>
            <p className="nl-text">{text}</p>
            <fieldset className="nl-set">
              <legend className="nl-legend">What to receive</legend>
              <div className="nl-tiles">
                {TOPICS.map((t) => (
                  <label key={t.id} className="nl-tile">
                    <input type="checkbox" checked={topics.includes(t.id)} onChange={() => toggle(t.id)} />
                    <span className="nl-tick" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg></span>
                    {t.id === "insights"
                      ? <svg className="nl-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 20h18" /><path d="M5 16l4-5 4 3 6-8" /></svg>
                      : <svg className="nl-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="1" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>}
                    <b>{t.label}</b><small>{t.hint}</small>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="nl-set">
              <legend className="nl-legend">How often</legend>
              <div className="nl-seg" role="radiogroup">
                {FREQUENCIES.map((f) => (
                  <label key={f.id} className="nl-seg-opt">
                    <input type="radio" name={`${id}-freq`} value={f.id} checked={freq === f.id} onChange={() => setFreq(f.id)} />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>
              <span className="nl-hint">{HINTS[freq]}</span>
            </fieldset>
            <div className="stack" style={{ ["--g" as string]: "8px" }}>
              <label htmlFor={`${id}-email`} className="nl-legend">Your email</label>
              <div className="nl-email">
                <input id={`${id}-email`} type="email" autoComplete="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button type="submit" aria-label="Subscribe" disabled={st.kind === "sending"}>
                  {st.kind === "sending" ? "…" : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
                </button>
              </div>
              {withName ? (
                <div className="stack" style={{ ["--g" as string]: "6px" }}>
                  <label htmlFor={`${id}-name`} className="nl-legend">Name <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· optional</span></label>
                  <input id={`${id}-name`} className="nl-input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              ) : (
                <button type="button" className="nl-link" onClick={() => setWithName(true)}>+ Add your name</button>
              )}
            </div>
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} />
            <label className="nl-consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>I’d like the {freqLabel} briefing. We’ll email a link to confirm; unsubscribe any time. See the <a href="/legal/privacy">privacy policy</a>.</span>
            </label>
            {st.kind === "error" && <p className="nl-err" role="alert">{st.message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

/** Wide band (Home): the prototype's simple sign-up — email and Subscribe; preferences come in the confirmation email. */
export function NewsletterBand({ title = "The next insight", text = "New research, index editions and summit invitations — shared with our community first.", source }: { title?: string; text?: string; source: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [st, setSt] = useState<Status>({ kind: "idle" });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setSt({ kind: "error", message: "Please enter a valid email address." });
    setSt({ kind: "sending" });
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: email.trim(), frequency: "monthly", topics: ["insights", "events"], consent: true, source, website: hp }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) return setSt({ kind: "error", message: json.message || "Something went wrong. Please try again." });
      setSt({ kind: "done" });
    } catch { setSt({ kind: "error", message: "We couldn't reach the server. Check your connection and try again." }); }
  }
  return (
    <section className="sand" id="newsletter">
      <div className="wrap tight grid" style={{ ["--min" as string]: "320px", ["--g" as string]: "32px 80px", alignItems: "end" }}>
        <div className="stack" style={{ ["--g" as string]: "12px" }}>
          <span className="kicker">Stay informed</span>
          <h2 className="h2-big">{title.replace(/\.$/, "")}<span className="dot">.</span></h2>
        </div>
        {st.kind === "done" ? (
          <div className="stack" style={{ ["--g" as string]: "8px" }} role="status"><b>Check your inbox.</b><span style={{ color: "var(--ink-body)" }}>We sent a link to {email.trim()} to confirm. You can choose topics and frequency there.</span></div>
        ) : (
          <form className="stack" style={{ ["--g" as string]: "12px" }} onSubmit={submit} noValidate>
            <p style={{ color: "var(--ink-body)" }}>{text}</p>
            <label htmlFor={`${id}-e`} style={{ fontSize: 12, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase" }}>Email address</label>
            <div className="row" style={{ ["--g" as string]: "8px", flexWrap: "wrap" }}>
              <input id={`${id}-e`} type="email" autoComplete="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: "1 1 240px", minHeight: 48, padding: "0 16px", border: "1px solid var(--ink)", background: "var(--paper)", font: "inherit", fontSize: 15, borderRadius: 0 }} />
              <button type="submit" className="btn btn-dark" disabled={st.kind === "sending"}>{st.kind === "sending" ? "Sending…" : "Subscribe"}</button>
            </div>
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} style={{ position: "absolute", left: -9999 }} />
            {st.kind === "error" && <p role="alert" style={{ color: "var(--red-dark)", fontSize: 14 }}>{st.message}</p>}
            <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Double opt-in. Unsubscribe any time. See our <a href="/legal/privacy" style={{ color: "inherit" }}>privacy policy</a>.</span>
          </form>
        )}
      </div>
    </section>
  );
}
