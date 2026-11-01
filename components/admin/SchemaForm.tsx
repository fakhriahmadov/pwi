"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Field, Section, Values } from "@/lib/fields";
import { renderMarkdown } from "@/lib/markdown";

type Button = { action: string; label: string; variant: "primary" | "secondary" | "quiet"; confirm?: string };

const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;
const card: React.CSSProperties = { background: "var(--white)", padding: "clamp(20px,3vw,32px)", display: "flex", flexDirection: "column", gap: 18 };

/** Generic editor: renders fields from a definition and posts { action, values } to `endpoint`. */
export function SchemaForm({ sections, initial, endpoint, buttons, previewPath, status }: { sections: Section[]; initial: Values; endpoint: string; buttons: Button[]; previewPath?: string; status?: React.ReactNode }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const dirty = JSON.stringify(values) !== saved;
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  async function run(action: string) {
    setBusy(action); setMsg(null); setArmed(null);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, values }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) { setMsg({ ok: false, text: json.message || "Something went wrong. Please try again." }); return null; }
      setMsg({ ok: true, text: json.message || "Saved." });
      if (json.redirect) { router.push(json.redirect); return json; }
      if (json.values) { setValues(json.values); setSaved(JSON.stringify(json.values)); } else setSaved(JSON.stringify(values));
      router.refresh();
      return json;
    } catch { setMsg({ ok: false, text: "We couldn't reach the server. Check your connection and try again." }); return null; }
    finally { setBusy(null); top.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }

  async function preview() {
    const r = await run(buttons.some((b) => b.action === "draft") ? "draft" : "save");
    if (r && previewPath) window.open(`/api/admin/preview?path=${encodeURIComponent(previewPath)}`, "_blank", "noopener");
  }

  return (
    <div className="stack" style={v("--g", "24px")} ref={top}>
      <div className="row between" style={{ alignItems: "center", position: "sticky", top: 0, zIndex: 5, background: "var(--paper)", padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
        <div className="row" style={{ alignItems: "center", ...v("--g", "8px 14px") }}>
          {status}
          {dirty && <span className="pill PENDING_APPROVAL">Unsaved changes</span>}
        </div>
        <div className="row" style={v("--g", "8px")}>
          {previewPath && <button type="button" className="btn btn-ghost" onClick={preview} disabled={!!busy}>Preview</button>}
          {buttons.map((b) => armed === b.action ? (
            <span key={b.action} className="row" style={{ alignItems: "center", ...v("--g", "6px") }}>
              <span style={{ fontSize: 13 }}>{b.confirm}</span>
              <button type="button" className="btn btn-red" onClick={() => run(b.action)} disabled={!!busy}>Yes</button>
              <button type="button" className="btn btn-ghost" onClick={() => setArmed(null)}>No</button>
            </span>
          ) : (
            <button key={b.action} type="button" disabled={!!busy}
              className={`btn ${b.variant === "primary" ? "btn-red" : b.variant === "secondary" ? "btn-dark" : "btn-ghost"}`}
              onClick={() => (b.confirm ? setArmed(b.action) : run(b.action))}>{busy === b.action ? "Saving…" : b.label}</button>
          ))}
        </div>
      </div>
      {msg && <p className={`notice ${msg.ok ? "okay" : "err"}`} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
      {sections.map((s) => (
        <section key={s.title} style={card}>
          <div className="stack" style={v("--g", "4px")}><h2 className="h3" style={{ fontSize: 22 }}>{s.title}</h2>{s.help && <p className="muted" style={{ fontSize: 14 }}>{s.help}</p>}</div>
          {s.fields.map((f) => <FieldInput key={f.key} field={f} value={values[f.key]} onChange={(x) => setValues((p) => ({ ...p, [f.key]: x }))} idPrefix={s.title} />)}
        </section>
      ))}
    </div>
  );
}

function FieldInput({ field: f, value, onChange, idPrefix }: { field: Field; value: unknown; onChange: (v: unknown) => void; idPrefix: string }) {
  const id = `${idPrefix}-${f.key}`.replace(/[^a-zA-Z0-9-]/g, "-");
  const help = f.help ? <span className="muted" style={{ fontSize: 12 }}>{f.help}</span> : null;
  const str = typeof value === "string" ? value : value == null ? "" : String(value);

  if (f.type === "list") {
    const items = Array.isArray(value) ? (value as Values[]) : [];
    const set = (next: Values[]) => onChange(next);
    return (
      <fieldset style={{ border: 0, margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <legend className="label-s" style={{ marginBottom: 6 }}>{f.label}</legend>
        {help}
        {items.map((it, i) => (
          <div key={i} style={{ border: "1px solid var(--line)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="row between" style={{ alignItems: "center" }}>
              <b style={{ fontWeight: 500, fontSize: 14 }}>{f.itemLabel} {i + 1}</b>
              <span className="row" style={{ ["--g" as string]: "4px" }}>
                <button type="button" className="chip" aria-label={`Move ${f.itemLabel} ${i + 1} up`} disabled={i === 0} onClick={() => { const n = [...items]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set(n); }}>↑</button>
                <button type="button" className="chip" aria-label={`Move ${f.itemLabel} ${i + 1} down`} disabled={i === items.length - 1} onClick={() => { const n = [...items]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set(n); }}>↓</button>
                <button type="button" className="chip" onClick={() => set(items.filter((_, j) => j !== i))}>Remove</button>
              </span>
            </div>
            {f.fields.map((sf) => <FieldInput key={sf.key} field={sf} value={it[sf.key]} idPrefix={`${id}-${i}`} onChange={(x) => set(items.map((o, j) => (j === i ? { ...o, [sf.key]: x } : o)))} />)}
          </div>
        ))}
        {(!f.max || items.length < f.max) && <button type="button" className="btn btn-ghost" style={{ alignSelf: "flex-start" }} onClick={() => set([...items, {}])}>+ Add {f.itemLabel.toLowerCase()}</button>}
      </fieldset>
    );
  }
  if (f.type === "image") return <ImageInput id={id} label={f.label} help={f.help} value={str} onChange={onChange} shape={f.shape} />;
  if (f.type === "markdown") return <MarkdownInput id={id} label={f.label} help={help} value={str} onChange={onChange} />;
  if (f.type === "select")
    return <div className="field"><label htmlFor={id}>{f.label}</label><select id={id} className="input" value={str} onChange={(e) => onChange(e.target.value)}>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{help}</div>;
  if (f.type === "tags") {
    const list = Array.isArray(value) ? (value as string[]) : [];
    return <div className="field"><label htmlFor={id}>{f.label}</label><input id={id} className="input" defaultValue={list.join(", ")} placeholder={f.placeholder} onBlur={(e) => onChange(e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />{help ?? <span className="muted" style={{ fontSize: 12 }}>Separate with commas.</span>}</div>;
  }
  if (f.type === "textarea")
    return <div className="field"><label htmlFor={id}>{f.label}</label><textarea id={id} className="input" rows={3} value={str} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />{help}</div>;
  return (
    <div className="field"><label htmlFor={id}>{f.label}</label>
      <input id={id} className="input" type={f.type === "number" ? "number" : f.type} value={str} placeholder={f.placeholder}
        onChange={(e) => onChange(f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} />{help}</div>
  );
}

function ImageInput({ id, label, help, value, onChange, shape = "wide" }: { id: string; label: string; help?: string; value: string; onChange: (v: unknown) => void; shape?: string }) {
  const [state, setState] = useState<string | null>(null);
  const ratio = shape === "portrait" ? "4 / 5" : shape === "square" ? "1 / 1" : shape === "logo" ? "3 / 2" : "16 / 9";
  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) { setState("This image is larger than 5 MB."); return; }
    setState("Uploading…");
    const fd = new FormData(); fd.append("file", file);
    try {
      const r = await fetch("/api/admin/media", { method: "POST", body: fd }); const j = await r.json();
      if (!r.ok || !j.url) { setState(j.message || "The upload failed."); return; }
      onChange(j.url); setState(null);
    } catch { setState("The upload failed. Check your connection."); }
  }
  return (
    <div className="stack" style={{ ["--g" as string]: "8px" }}>
      <span className="label-s">{label}</span>
      <div style={{ width: 220, maxWidth: "100%", aspectRatio: ratio, background: "var(--sand)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {value ? <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: shape === "logo" ? "contain" : "cover" }} /> : <span className="muted" style={{ fontSize: 12 }}>No image</span>}
      </div>
      <div className="row" style={{ ["--g" as string]: "8px" }}>
        <label htmlFor={id} className="chip" style={{ cursor: "pointer" }}>{value ? "Replace image" : "Choose image"}</label>
        <input id={id} type="file" accept="image/*" className="hp" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        {value && <button type="button" className="chip" onClick={() => onChange("")}>Remove</button>}
      </div>
      {state && <span className="notice" style={{ fontSize: 13 }} role="status">{state}</span>}
      {help && <span className="muted" style={{ fontSize: 12 }}>{help}</span>}
    </div>
  );
}

function MarkdownInput({ id, label, help, value, onChange }: { id: string; label: string; help: React.ReactNode; value: string; onChange: (v: unknown) => void }) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const html = useMemo(() => (tab === "preview" ? renderMarkdown(value) : ""), [tab, value]);
  return (
    <div className="field">
      <div className="row between" style={{ alignItems: "center" }}>
        <label htmlFor={id}>{label}</label>
        <span className="row" style={{ ["--g" as string]: "6px" }}>
          <button type="button" className="chip" aria-pressed={tab === "write"} onClick={() => setTab("write")}>Write</button>
          <button type="button" className="chip" aria-pressed={tab === "preview"} onClick={() => setTab("preview")}>Preview</button>
        </span>
      </div>
      {tab === "write"
        ? <textarea id={id} className="input" rows={16} value={value} onChange={(e) => onChange(e.target.value)} style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 14, lineHeight: 1.7 }} />
        : <div className="prose" style={{ maxWidth: "none", background: "var(--white)", border: "1px solid var(--line)", padding: 20 }} dangerouslySetInnerHTML={{ __html: html || "<p>Nothing written yet.</p>" }} />}
      {help ?? <span className="muted" style={{ fontSize: 12 }}>Formatting: ## heading, **bold**, _italic_, - list, [link](https://…).</span>}
    </div>
  );
}
