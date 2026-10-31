"use client";
import { useSubmit } from "./useSubmit";

export function NewsletterForm({ source, id = "nl" }: { source: string; id?: string }) {
  const { state, submit } = useSubmit("/api/newsletter");
  if (state.status === "done")
    return <p className="notice okay" role="status">Check your inbox — we sent a link to confirm your subscription.</p>;
  return (
    <form className="form" style={{ gap: 10 }} onSubmit={(e) => submit(e, { source })} noValidate>
      <label htmlFor={`${id}-email`} className="kicker" style={{ color: "var(--black)" }}>Email address</label>
      <div className="row" style={{ ["--g" as string]: "8px" }}>
        <input id={`${id}-email`} name="email" type="email" required autoComplete="email" placeholder="name@company.com" className="input" style={{ flex: "1 1 min(240px, 100%)", width: "auto", borderColor: "var(--black)" }} />
        <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button className="btn btn-dark" disabled={state.status === "sending"}>{state.status === "sending" ? "Sending…" : "Subscribe"}</button>
      </div>
      {state.status === "error" && <p className="notice err" role="alert">{state.message}</p>}
      <span style={{ fontSize: 12, color: "var(--muted)" }}>We'll email you a confirmation link. Unsubscribe any time.</span>
    </form>
  );
}

export function NewsletterBand({ title = "The next insight", source }: { title?: string; source: string }) {
  return (
    <section className="sand">
      <div className="wrap tight grid" style={{ ["--min" as string]: "320px", ["--g" as string]: "32px 80px", alignItems: "end" }}>
        <div className="stack" style={{ ["--g" as string]: "12px" }}>
          <span className="kicker">Stay informed</span>
          <h2 className="h2-big">{title}<span className="dot">.</span></h2>
        </div>
        <div className="stack" style={{ ["--g" as string]: "12px" }}>
          <p style={{ color: "var(--ink)" }}>New research, the EuroCapital Index and summit invitations — shared with our community first.</p>
          <NewsletterForm source={source} />
        </div>
      </div>
    </section>
  );
}
