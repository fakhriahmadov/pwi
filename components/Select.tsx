"use client";
import { useEffect, useId, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

/**
 * Site dropdown in the design code: square field, ink border, an open panel on paper with a
 * red mark on the chosen option. Replaces the browser's own menu so it looks the same everywhere.
 * Controlled (value + onChange) or uncontrolled (defaultValue + name, posted through a hidden input).
 */
export function Select({ id, name, value, defaultValue, onChange, options, placeholder = "Choose…", style, required }: {
  id?: string; name?: string; required?: boolean; value?: string; defaultValue?: string; onChange?: (v: string) => void;
  options: (SelectOption | string)[]; placeholder?: string; style?: React.CSSProperties;
}) {
  const opts: SelectOption[] = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const autoId = useId();
  const listId = `${id || autoId}-list`;
  const chosen = opts.find((o) => o.value === current);

  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);
  useEffect(() => { if (open) list.current?.children[hi]?.scrollIntoView({ block: "nearest" }); }, [open, hi]);

  const pick = (v: string) => { if (value === undefined) setInner(v); onChange?.(v); setOpen(false); };
  const show = () => { setHi(Math.max(0, opts.findIndex((o) => o.value === current))); setOpen(true); };
  const key = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); show(); }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(opts.length - 1, h + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setHi(0); }
    else if (e.key === "End") { e.preventDefault(); setHi(opts.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (opts[hi]) pick(opts[hi].value); }
    else if (e.key.length === 1) { const i = opts.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase())); if (i >= 0) setHi(i); }
  };

  return (
    <div className={`sel${open ? " is-open" : ""}`} ref={root} style={style}>
      {name && (required
        ? <input tabIndex={-1} aria-hidden="true" name={name} value={current} required onChange={() => {}} onFocus={() => document.getElementById(id || "")?.focus()} className="sel-req" />
        : <input type="hidden" name={name} value={current} />)}
      <button type="button" id={id} className="sel-btn" role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${hi}` : undefined} onClick={() => (open ? setOpen(false) : show())} onKeyDown={key}>
        <span className={chosen ? "" : "sel-ph"}>{chosen ? chosen.label : placeholder}</span>
        <svg className="sel-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <ul className="sel-list" role="listbox" id={listId} ref={list} aria-labelledby={id}>
          {opts.map((o, i) => (
            <li key={o.value} id={`${listId}-${i}`} role="option" aria-selected={o.value === current}
              className={`sel-opt${i === hi ? " is-hi" : ""}`} onMouseEnter={() => setHi(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o.value)}>
              <span>{o.label}</span>
              {o.value === current && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
