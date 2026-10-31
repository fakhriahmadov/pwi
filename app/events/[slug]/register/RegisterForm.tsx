"use client";
import { useMemo, useState } from "react";
import { longDate, weekday } from "@/lib/format";

type PassOpt = { id: string; name: string; description: string; priceCents: number | null; onRequest: boolean; label: string };
type Ev = { slug: string; city: string; date: string; venue: string; accent: string; approval: boolean };

const euro = (c: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: c % 100 ? 2 : 0 }).format(c / 100);
const STEPS = ["Pass", "Details", "Review"];

export function RegisterForm({ event, passes, initialPass }: { event: Ev; passes: PassOpt[]; initialPass?: string }) {
  const [step, setStep] = useState(1);
  const [passId, setPassId] = useState(passes.some((p) => p.id === initialPass) ? initialPass! : (passes.find((p) => !p.onRequest) ?? passes[0]).id);
  const [qty, setQty] = useState(1);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", role: "", heardFrom: "Invitation from the institute", vatNumber: "", invoiceCompany: "", marketingOptIn: false, terms: false, website: "" });
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const pass = passes.find((p) => p.id === passId)!;
  const total = pass.priceCents != null && !pass.onRequest ? pass.priceCents * qty : null;
  const personal = pass.onRequest || event.approval;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  const detailsValid = useMemo(() => f.firstName && f.lastName && /\S+@\S+\.\S+/.test(f.email), [f]);

  function next() {
    setErr(null);
    if (step === 1 && pass.priceCents == null && !pass.onRequest) { setErr("Prices for this pass haven't been announced yet."); return; }
    if (step === 2 && !detailsValid) { setErr("Please fill in your first name, last name and a valid email address."); return; }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (!f.terms) { setErr("Please accept the terms of registration."); return; }
    setErr(null); setSending(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, eventSlug: event.slug, passId, quantity: qty }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.redirect) { setErr(json.message || "Something went wrong. Please try again."); setSending(false); return; }
      window.location.href = json.redirect;
    } catch { setErr("We couldn't reach the server. Check your connection and try again."); setSending(false); }
  }

  return (
    <>
      <ol aria-label="Registration steps" className="row" style={{ listStyle: "none", margin: 0, padding: 0, ["--g" as string]: "8px 32px" }}>
        {STEPS.map((s, i) => (
          <li key={s} aria-current={step === i + 1 ? "step" : undefined} style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 44, fontSize: 14, borderBottom: `2px solid ${step === i + 1 ? event.accent : step > i + 1 ? "var(--black)" : "transparent"}`, color: step >= i + 1 ? "var(--black)" : "var(--muted)", fontWeight: step === i + 1 ? 500 : 400 }}>
            <span style={{ fontFamily: "var(--display)", fontWeight: 500 }}>{String(i + 1).padStart(2, "0")}</span> {s}
          </li>
        ))}
      </ol>
      <div className="row" style={{ ["--g" as string]: "24px", alignItems: "flex-start" }}>
        <div className="stack min0" style={{ flex: "2 1 560px", background: "var(--white)", padding: "clamp(24px,3vw,48px)", ["--g" as string]: "24px" }}>
          {step === 1 && (
            <div className="stack" style={{ ["--g" as string]: "20px" }}>
              <h2 className="h3" style={{ fontSize: 28 }}>Choose your pass</h2>
              <div role="radiogroup" aria-label="Pass" className="stack" style={{ ["--g" as string]: "12px" }}>
                {passes.map((p) => {
                  const on = p.id === passId;
                  return (
                    <button key={p.id} type="button" role="radio" aria-checked={on} onClick={() => setPassId(p.id)}
                      style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "8px 16px", width: "100%", padding: "20px 24px", font: "inherit", color: "var(--black)", cursor: "pointer", border: 0, textAlign: "left", background: on ? "#EEF2FD" : "var(--white)", boxShadow: on ? `inset 0 0 0 2px ${event.accent}` : "inset 0 0 0 1px #D9D4CC" }}>
                      <span className="stack" style={{ ["--g" as string]: "2px", flex: "1 1 200px", minWidth: 0 }}><span className="h3" style={{ fontSize: 20 }}>{p.name}</span><span className="muted" style={{ fontSize: 13 }}>{p.description}</span></span>
                      <span style={{ fontFamily: "var(--display)", fontSize: 20 }}>{p.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="field" style={{ flex: "0 1 200px", maxWidth: 200 }}>
                <label htmlFor="qty">Number of guests</label>
                <select id="qty" className="input" value={qty} onChange={(e) => setQty(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="stack" style={{ ["--g" as string]: "18px" }}>
              <h2 className="h3" style={{ fontSize: 28 }}>Your details</h2>
              <div className="row" style={{ ["--g" as string]: "16px" }}>
                <div className="field"><label htmlFor="fn">First name</label><input id="fn" className="input" autoComplete="given-name" value={f.firstName} onChange={set("firstName")} required /></div>
                <div className="field"><label htmlFor="ln">Last name</label><input id="ln" className="input" autoComplete="family-name" value={f.lastName} onChange={set("lastName")} required /></div>
              </div>
              <div className="row" style={{ ["--g" as string]: "16px" }}>
                <div className="field"><label htmlFor="em">Email</label><input id="em" type="email" className="input" autoComplete="email" value={f.email} onChange={set("email")} required /></div>
                <div className="field"><label htmlFor="ph">Phone</label><input id="ph" type="tel" className="input" autoComplete="tel" value={f.phone} onChange={set("phone")} /></div>
              </div>
              <div className="row" style={{ ["--g" as string]: "16px" }}>
                <div className="field"><label htmlFor="co">Company / family office</label><input id="co" className="input" autoComplete="organization" value={f.company} onChange={set("company")} /></div>
                <div className="field"><label htmlFor="ro">Role</label><input id="ro" className="input" autoComplete="organization-title" value={f.role} onChange={set("role")} /></div>
              </div>
              <div className="field"><label htmlFor="hear">How did you hear about the summit?</label>
                <select id="hear" className="input" value={f.heardFrom} onChange={set("heardFrom")}>{["Invitation from the institute", "Colleague or partner", "LinkedIn", "Press", "Other"].map((o) => <option key={o}>{o}</option>)}</select></div>
              {!personal && (
                <div className="row" style={{ ["--g" as string]: "16px" }}>
                  <div className="field"><label htmlFor="inv">Invoice company name (optional)</label><input id="inv" className="input" value={f.invoiceCompany} onChange={set("invoiceCompany")} /></div>
                  <div className="field"><label htmlFor="vat">VAT number (optional)</label><input id="vat" className="input" value={f.vatNumber} onChange={set("vatNumber")} /></div>
                </div>
              )}
              <label className="check"><input type="checkbox" checked={f.marketingOptIn} onChange={set("marketingOptIn")} />Keep me informed about future summits and research.</label>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set("website")} />
            </div>
          )}
          {step === 3 && (
            <div className="stack" style={{ ["--g" as string]: "18px" }}>
              <h2 className="h3" style={{ fontSize: 28 }}>Review</h2>
              <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "160px minmax(0,1fr)", gap: "8px 16px", fontSize: 15 }}>
                <dt className="muted">Name</dt><dd style={{ margin: 0 }}>{f.firstName} {f.lastName}</dd>
                <dt className="muted">Email</dt><dd style={{ margin: 0 }}>{f.email}</dd>
                {f.company && <><dt className="muted">Company</dt><dd style={{ margin: 0 }}>{f.company}</dd></>}
                <dt className="muted">Pass</dt><dd style={{ margin: 0 }}>{pass.name} × {qty}</dd>
              </dl>
              <p className="muted" style={{ fontSize: 14 }}>{personal ? "Our team reviews each request and replies personally." : "You'll continue to secure payment by Stripe — card, Apple Pay, Google Pay or SEPA. Your e-ticket arrives by email."}</p>
              <label className="check"><input type="checkbox" checked={f.terms} onChange={set("terms")} />I accept the <a href="/legal/terms" target="_blank">terms of registration</a> and the <a href="/legal/privacy" target="_blank">privacy policy</a>.</label>
            </div>
          )}
          {err && <p className="notice err" role="alert">{err}</p>}
          <div className="row between" style={{ borderTop: "1px solid var(--line)", paddingTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={() => { setErr(null); setStep(step - 1); }} disabled={step === 1}>Back</button>
            {step < 3
              ? <button type="button" className="btn btn-acc" onClick={next}>Continue</button>
              : <button type="button" className="btn btn-acc" onClick={submit} disabled={sending}>{sending ? "One moment…" : personal ? "Send request" : "Continue to payment"}</button>}
          </div>
        </div>
        <aside aria-label="Summary" className="dark stack" style={{ flex: "1 1 300px", padding: 32, ["--g" as string]: "16px" }}>
          <span className="label" style={{ color: "var(--ondark)" }}>Summary</span>
          <span style={{ fontFamily: "var(--display)", fontSize: 40, lineHeight: .95, letterSpacing: "-.04em" }}>{event.city}<span style={{ color: event.accent }}>.</span></span>
          <span style={{ fontSize: 14, color: "var(--ondark-2)" }}>{weekday(event.date)}, {longDate(event.date)}<br />{event.venue}</span>
          <div className="row between" style={{ borderTop: "1px solid var(--line-dark)", paddingTop: 16 }}><span>{pass.name} × {qty}</span><span>{pass.label}</span></div>
          <div className="row between" style={{ borderTop: "1px solid var(--line-dark)", paddingTop: 16, fontFamily: "var(--display)", fontSize: 22 }}><span>Total</span><span>{total != null ? euro(total) : "—"}</span></div>
          <span style={{ fontSize: 12, color: "var(--ondark)" }}>Prices include VAT where applicable. Questions? info@privatewealth.institute</span>
        </aside>
      </div>
    </>
  );
}
