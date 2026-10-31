"use client";
import { useState } from "react";
import { useSubmit } from "@/components/useSubmit";

export function DataRequestForm() {
  const { state, submit } = useSubmit("/api/enquiry");
  return (
    <div className="sand" style={{ flex: "1 1 min(320px, 100%)", padding: 32 }}>
      {state.status === "done" ? (
        <p role="status" className="h3" style={{ fontSize: 22 }}>Thank you — we've received your request and will reply by email.</p>
      ) : (
        <form className="form" style={{ gap: 14 }} onSubmit={(e) => submit(e, { topic: "data" })}>
          <span className="h3" style={{ fontSize: 26 }}>Request the data</span>
          <p style={{ fontSize: 14, color: "var(--ink)" }}>For press, academics and partners.</p>
          <div className="field"><label htmlFor="rq-name">Full name</label><input id="rq-name" name="name" required className="input" autoComplete="name" /></div>
          <div className="field"><label htmlFor="rq-email">Work email</label><input id="rq-email" name="email" type="email" required className="input" autoComplete="email" /></div>
          <div className="field"><label htmlFor="rq-company">Organisation</label><input id="rq-company" name="company" className="input" autoComplete="organization" /></div>
          <div className="field"><label htmlFor="rq-use">Intended use</label>
            <select id="rq-use" name="message" className="input"><option>Press</option><option>Academic research</option><option>Partner / commercial</option></select></div>
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          {state.status === "error" && <p className="notice err" role="alert">{state.message}</p>}
          <button className="btn btn-dark" disabled={state.status === "sending"}>{state.status === "sending" ? "Sending…" : "Send request"}</button>
        </form>
      )}
    </div>
  );
}

export function ReportDownload({ title, file }: { title: string; file: string }) {
  const [open, setOpen] = useState(false);
  const { state, submit } = useSubmit("/api/enquiry");
  if (state.status === "done") return <a href={file} className="btn btn-dark">Download PDF</a>;
  if (!open) return <button type="button" className="more" style={{ background: "none", border: 0, cursor: "pointer", font: "inherit", fontSize: 13 }} onClick={() => setOpen(true)}>Download</button>;
  return (
    <form className="row" style={{ ["--g" as string]: "8px" }} onSubmit={(e) => submit(e, { topic: "report", message: title, name: "Report download" })}>
      <label htmlFor={`rd-${file}`} className="hp">Email</label>
      <input id={`rd-${file}`} name="email" type="email" required placeholder="Your email" className="input" style={{ width: 220 }} />
      <button className="btn btn-dark">Get the PDF</button>
      {state.status === "error" && <p className="notice err" role="alert">{state.message}</p>}
    </form>
  );
}
