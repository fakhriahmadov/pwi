"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { IMAGE_SPECS, recText } from "@/lib/image-specs";

/** Image input with the current image, a live preview of the new file, and a remove option. */
export function ImageField({ name, label, current, removeName, shape = "portrait" }: { name: string; label: string; current: string | null; removeName: string; shape?: "portrait" | "square" | "logo" | "cover" }) {
  const spec = IMAGE_SPECS[shape === "logo" ? "logo" : shape === "cover" ? "cover" : shape === "square" ? "portrait" : "team"];
  const [warn, setWarn] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown = preview || current;
  const ratio = shape === "portrait" ? "4 / 5" : shape === "square" ? "1 / 1" : shape === "cover" ? "21 / 9" : "3 / 2";
  const id = `${name}-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="stack" style={{ ["--g" as string]: "8px" }}>
      <span className="label-s">{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500 }}>{recText(spec)}</span>
      <span className="muted" style={{ fontSize: 12 }}>{spec.note}</span>
      <div style={{ width: shape === "logo" ? 180 : shape === "cover" ? 360 : 160, maxWidth: "100%", aspectRatio: ratio, background: shape === "logo" ? "var(--paper)" : "var(--sand-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {shown ? <img src={shown} alt="" style={{ width: "100%", height: "100%", objectFit: shape === "logo" ? "contain" : "cover", padding: shape === "logo" ? 12 : 0 }} /> : <span className="muted" style={{ fontSize: 12 }}>No image</span>}
      </div>
      <label htmlFor={id} className="chip" style={{ alignSelf: "flex-start", cursor: "pointer" }}>{shown ? "Replace image" : "Choose image"}</label>
      <input id={id} name={name} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml" className="hp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          setError(null);
          if (!f) return setPreview(null);
          if (f.size > 5 * 1024 * 1024) { setError("This image is larger than 5 MB. Please choose a smaller file."); e.target.value = ""; return; }
          const url = URL.createObjectURL(f);
          setPreview(url); setWarn(null);
          const img = new Image();
          img.onload = () => { if (img.naturalWidth < spec.min[0] || img.naturalHeight < spec.min[1]) setWarn(`This image is ${img.naturalWidth} × ${img.naturalHeight} px, smaller than the ${spec.min[0]} × ${spec.min[1]} px minimum: it may look soft on large screens.`); };
          img.src = url;
        }} />
      {error && <span className="notice err" role="alert" style={{ fontSize: 13 }}>{error}</span>}
      {warn && <span className="notice err" role="status" style={{ fontSize: 13 }}>{warn}</span>}
      {current && !preview && <label className="check" style={{ fontSize: 13 }}><input type="checkbox" name={removeName} />Remove current image</label>}
      <span className="muted" style={{ fontSize: 12 }}>JPG, PNG, WebP or SVG · up to 5 MB</span>
    </div>
  );
}

export function SaveButton({ children = "Save", variant = "dark" }: { children?: React.ReactNode; variant?: "dark" | "ghost" }) {
  const { pending } = useFormStatus();
  return <button className={`btn btn-${variant}`} disabled={pending}>{pending ? "Saving…" : children}</button>;
}

export function DeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const [armed, setArmed] = useState(false);
  if (!armed) return <button type="button" className="btn btn-ghost" onClick={() => setArmed(true)}>Remove</button>;
  return (
    <span className="row" style={{ ["--g" as string]: "8px", alignItems: "center" }}>
      <span style={{ fontSize: 13 }}>Remove {label}?</span>
      <button className="btn btn-red" disabled={pending}>{pending ? "Removing…" : "Yes, remove"}</button>
      <button type="button" className="btn btn-ghost" onClick={() => setArmed(false)}>Keep</button>
    </span>
  );
}
