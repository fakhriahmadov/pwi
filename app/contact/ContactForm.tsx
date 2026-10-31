"use client";
import { useState } from "react";
import { useSubmit } from "@/components/useSubmit";

const TOPICS = [
  { id: "general", label: "General" },
  { id: "partner", label: "Partnership & sponsorship" },
  { id: "press", label: "Press" },
  { id: "speak", label: "Speaking at a summit" },
  { id: "data", label: "Research & data" },
];

export function ContactForm({ initialTopic }: { initialTopic: string }) {
  const [topic, setTopic] = useState(initialTopic);
  const { state, submit } = useSubmit("/api/enquiry");
  if (state.status === "done")
    return (
      <div className="stack min0" style={{ flex: "2 1 560px", ["--g" as string]: "12px" }} role="status">
        <h2 className="h2">Message sent<span className="dot">.</span></h2>
        <p style={{ color: "var(--ink)" }}>Thank you. We've received your message and will reply by email.</p>
      </div>
    );
  return (
    <form className="form min0" style={{ flex: "2 1 560px" }} onSubmit={(e) => submit(e, { topic })}>
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend className="kicker" style={{ padding: 0, marginBottom: 12 }}>What is it about?</legend>
        <div className="row" style={{ ["--g" as string]: "8px" }}>
          {TOPICS.map((t) => <button key={t.id} type="button" className="chip" aria-pressed={topic === t.id} onClick={() => setTopic(t.id)}>{t.label}</button>)}
        </div>
      </fieldset>
      <div className="row" style={{ ["--g" as string]: "16px" }}>
        <div className="field"><label htmlFor="c-name">Full name</label><input id="c-name" name="name" required className="input" autoComplete="name" /></div>
        <div className="field"><label htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" required className="input" autoComplete="email" /></div>
      </div>
      <div className="row" style={{ ["--g" as string]: "16px" }}>
        <div className="field"><label htmlFor="c-org">Organisation</label><input id="c-org" name="company" className="input" autoComplete="organization" /></div>
        <div className="field"><label htmlFor="c-country">Country</label><input id="c-country" name="country" className="input" autoComplete="country-name" /></div>
      </div>
      <div className="field"><label htmlFor="c-msg">Message</label><textarea id="c-msg" name="message" required className="input" rows={6} /></div>
      <label className="check"><input type="checkbox" name="consent" required />I agree that the Private Wealth Institute may store my details to answer this enquiry (<a href="/legal/privacy">privacy policy</a>).</label>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {state.status === "error" && <p className="notice err" role="alert">{state.message}</p>}
      <button className="btn btn-red" style={{ alignSelf: "flex-start" }} disabled={state.status === "sending"}>{state.status === "sending" ? "Sending…" : "Send message →"}</button>
    </form>
  );
}
