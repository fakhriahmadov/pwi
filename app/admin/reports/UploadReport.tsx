"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function UploadReport() {
  const router = useRouter();
  const [state, setState] = useState<{ busy?: boolean; err?: string; ok?: string }>({});
  return (
    <form className="form" style={{ background: "var(--paper)", padding: "clamp(20px,3vw,32px)" }} onSubmit={async (e) => {
      e.preventDefault(); const form = e.currentTarget;
      setState({ busy: true });
      try {
        const r = await fetch("/api/admin/reports", { method: "POST", body: new FormData(form) }); const j = await r.json().catch(() => ({}));
        if (!r.ok || j.ok === false) { setState({ err: j.message || "The upload failed." }); return; }
        form.reset(); setState({ ok: "Report uploaded." }); router.refresh();
      } catch { setState({ err: "The upload failed. Check your connection." }); }
    }}>
      <h2 className="h3" style={{ fontSize: 22 }}>Upload a report</h2>
      <div className="row" style={{ ["--g" as string]: "16px" }}>
        <div className="field" style={{ flex: "2 1 min(320px,100%)" }}><label htmlFor="r-title">Title</label><input id="r-title" name="title" required className="input" placeholder="e.g. EuroCapital Index — 2025 edition" /></div>
        <div className="field" style={{ flex: "1 1 160px" }}><label htmlFor="r-date">Publication date</label><input id="r-date" name="date" type="date" required className="input" /></div>
        <div className="field" style={{ flex: "0 1 120px" }}><label htmlFor="r-pages">Pages</label><input id="r-pages" name="pages" type="number" min="1" className="input" /></div>
      </div>
      <div className="field"><label htmlFor="r-file">PDF file (up to 20 MB)</label><input id="r-file" name="file" type="file" accept="application/pdf,.pdf" required className="input" style={{ paddingTop: 10 }} /></div>
      <div className="row" style={{ ["--g" as string]: "8px 24px" }}>
        <label className="check"><input type="checkbox" name="gated" defaultChecked />Ask for an email before download</label>
        <label className="check"><input type="checkbox" name="publish" />Publish now</label>
      </div>
      {state.err && <p className="notice err" role="alert">{state.err}</p>}
      {state.ok && <p className="notice okay" role="status">{state.ok}</p>}
      <button className="btn btn-dark" style={{ alignSelf: "flex-start" }} disabled={state.busy}>{state.busy ? "Uploading…" : "Upload report"}</button>
    </form>
  );
}
