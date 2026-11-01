"use client";
import { useState } from "react";
import { FREQUENCIES, TOPICS } from "@/lib/newsletter-options";

type P = { token: string; email: string; name: string; frequency: string; topics: string[]; unsubscribed: boolean };

export function PreferencesForm(p: P) {
  const [freq, setFreq] = useState(p.frequency);
  const [topics, setTopics] = useState<string[]>(p.topics);
  const [name, setName] = useState(p.name);
  const [off, setOff] = useState(p.unsubscribed);
  const [confirmOff, setConfirmOff] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(action: "save" | "unsubscribe" | "resubscribe") {
    if (action !== "unsubscribe" && !topics.length) return setMsg({ ok: false, text: "Choose at least one topic — or unsubscribe." });
    setBusy(true);
    try {
      const res = await fetch("/api/newsletter/preferences", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: p.token, action, frequency: freq, topics, name }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) setMsg({ ok: false, text: json.message || "Something went wrong. Please try again." });
      else { setMsg({ ok: true, text: json.message || "Saved." }); setOff(action === "unsubscribe"); setConfirmOff(false); }
    } catch { setMsg({ ok: false, text: "We couldn't reach the server. Please try again." }); }
    setBusy(false);
  }

  return (
    <div className="stack" style={{ ["--g" as string]: "24px" }}>
      <div className="nl nl-light" style={{ overflow: "visible" }}>
        <div className="nl-in" style={{ gap: 20 }}>
          <p style={{ fontSize: 14 }}>{off ? "Not subscribed" : "Subscribed"} · <b style={{ fontWeight: 500 }}>{p.email}</b></p>
          <fieldset className="nl-set">
            <legend className="nl-legend">How often</legend>
            <div className="nl-seg" role="radiogroup">
              {FREQUENCIES.map((f) => (
                <label key={f.id} className="nl-seg-opt"><input type="radio" name="freq" checked={freq === f.id} onChange={() => setFreq(f.id)} /><span>{f.label}</span></label>
              ))}
            </div>
          </fieldset>
          <fieldset className="nl-set">
            <legend className="nl-legend">What to include</legend>
            <div className="nl-tiles">
              {TOPICS.map((t) => (
                <label key={t.id} className="nl-tile">
                  <input type="checkbox" checked={topics.includes(t.id)} onChange={() => setTopics((l) => (l.includes(t.id) ? l.filter((x) => x !== t.id) : [...l, t.id]))} />
                  <span><b>{t.label}</b><small>{t.hint}</small></span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="stack" style={{ ["--g" as string]: "6px" }}>
            <label htmlFor="pref-name" className="nl-legend">Name <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· optional</span></label>
            <input id="pref-name" className="nl-input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Event news only ever arrives inside the newsletter — never as separate invitations.</p>
          {msg && <p className={`notice ${msg.ok ? "okay" : "err"}`} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
          <div className="row" style={{ ["--g" as string]: "12px 20px", alignItems: "center" }}>
            <button type="button" className="btn btn-dark" disabled={busy} onClick={() => send(off ? "resubscribe" : "save")}>{off ? "Subscribe again" : "Save changes"}</button>
            {!off && !confirmOff && <button type="button" className="nl-link" onClick={() => setConfirmOff(true)}>Unsubscribe</button>}
          </div>
          {confirmOff && (
            <div className="stack" style={{ ["--g" as string]: "10px", padding: 16, background: "#FBE9E9" }}>
              <b style={{ fontWeight: 500 }}>Stop all newsletters?</b>
              <span style={{ fontSize: 14 }}>Tip: choose Annually instead to get just one email a year.</span>
              <div className="row" style={{ ["--g" as string]: "12px 20px", alignItems: "center" }}>
                <button type="button" className="btn btn-dark" disabled={busy} onClick={() => send("unsubscribe")}>Unsubscribe</button>
                <button type="button" className="nl-link" onClick={() => setConfirmOff(false)}>Keep my subscription</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
