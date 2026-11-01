"use client";
import { useId, useState } from "react";
import { FREQUENCIES, TOPICS } from "@/lib/newsletter-options";

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
              <legend className="nl-legend">What to include</legend>
              <div className="nl-tiles">
                {TOPICS.map((t) => (
                  <label key={t.id} className="nl-tile">
                    <input type="checkbox" checked={topics.includes(t.id)} onChange={() => toggle(t.id)} />
                    <span><b>{t.label}</b><small>{t.hint}</small></span>
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
            </fieldset>
            <div className="stack" style={{ ["--g" as string]: "8px" }}>
              <label htmlFor={`${id}-email`} className="nl-legend">Email address</label>
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

/** Wide band (Home, Events): text on the left, the sign-up on the right. */
export function NewsletterBand({ title = "The next insight", text = "Research, index updates and upcoming events — in one email, as often as you like.", source }: { title?: string; text?: string; source: string }) {
  return (
    <section className="sand">
      <div className="wrap tight grid" style={{ ["--min" as string]: "320px", ["--g" as string]: "32px 80px", alignItems: "center" }}>
        <div className="stack" style={{ ["--g" as string]: "12px" }}>
          <span className="kicker">Stay informed</span>
          <h2 className="h2-big">{title.replace(/\.$/, "")}<span className="dot">.</span></h2>
          <p style={{ color: "var(--ink-body)", maxWidth: "44ch" }}>{text}</p>
        </div>
        <NewsletterSignup source={source} tone="dark" title="Subscribe" text="Choose what to include and how often." />
      </div>
    </section>
  );
}
