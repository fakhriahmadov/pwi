"use client";
import { useMemo, useState } from "react";
import { SaveButton } from "../../about/fields";
import { saveIndex } from "../actions";

type Tag = { tag: string; count: number; label: string };
type Def = { id: string; name: string; slug: string; description: string; allTags: string[]; anyTags: string[]; baseYear: number | null; color: string; published: boolean; featured: boolean; order: number };
const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;
const card: React.CSSProperties = { background: "var(--white)", padding: "clamp(20px,3vw,32px)", display: "flex", flexDirection: "column", gap: 18 };
const GROUPS: [string, string][] = [["", "Your tags"], ["region", "Region"], ["generation", "Generation"], ["industry", "Industry"], ["gender", "Gender"], ["country", "Country"]];

function TagPicker({ name, title, hint, tags, selected, onChange }: { name: string; title: string; hint: string; tags: Tag[]; selected: string[]; onChange: (s: string[]) => void }) {
  const [q, setQ] = useState("");
  const shown = tags.filter((t) => !q || t.label.toLowerCase().includes(q.toLowerCase()));
  const toggle = (t: string) => onChange(selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t]);
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      <legend className="h3" style={{ fontSize: 19, padding: 0, marginBottom: 4 }}>{title}</legend>
      <p className="muted" style={{ fontSize: 13 }}>{hint}</p>
      {selected.map((t) => <input key={t} type="hidden" name={name} value={t} />)}
      <div className="row" style={v("--g", "6px")} aria-live="polite">
        {selected.length === 0 ? <span className="muted" style={{ fontSize: 13 }}>None selected</span> :
          selected.map((t) => <button type="button" key={t} className="chip" onClick={() => toggle(t)} aria-label={`Remove ${t}`} style={{ background: "var(--black)", color: "var(--white)" }}>{tags.find((x) => x.tag === t)?.label ?? t} ×</button>)}
      </div>
      <label className="hp" htmlFor={`${name}-q`}>Search tags</label>
      <input id={`${name}-q`} className="input" placeholder="Search tags…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid var(--line)", padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
        {GROUPS.map(([p, label]) => {
          const list = shown.filter((t) => (p ? t.tag.startsWith(p + ":") : !t.tag.includes(":")));
          if (!list.length) return null;
          return (
            <div key={p} className="stack" style={v("--g", "6px")}>
              <span className="label-s muted">{label}</span>
              <div className="row" style={v("--g", "6px")}>
                {list.map((t) => (
                  <label key={t.tag} className="tag" style={{ display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer", minHeight: 36 }}>
                    <input type="checkbox" checked={selected.includes(t.tag)} onChange={() => toggle(t.tag)} />
                    {t.label.replace(/^[^:]+:\s/, "")} <span className="muted">{t.count}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {tags.length === 0 && <span className="muted" style={{ fontSize: 13 }}>Upload data first — its tags appear here.</span>}
      </div>
    </fieldset>
  );
}

export function IndexForm({ def, tags, years }: { def: Def; tags: Tag[]; years: number[] }) {
  const [all, setAll] = useState(def.allTags);
  const [any, setAny] = useState(def.anyTags);
  const rule = useMemo(() => {
    const L = (t: string) => tags.find((x) => x.tag === t)?.label ?? t;
    if (!all.length && !any.length) return "Every fortune in the data.";
    return [all.length && `has ${all.map(L).join(" and ")}`, any.length && `has at least one of ${any.map(L).join(", ")}`].filter(Boolean).join(", and ") + ".";
  }, [all, any, tags]);
  return (
    <form action={saveIndex} className="row" style={{ ...v("--g", "24px"), alignItems: "flex-start" }}>
      <input type="hidden" name="id" value={def.id} />
      <div className="stack min0" style={{ flex: "2 1 min(620px,100%)", ...v("--g", "24px") }}>
        <div style={card}>
          <div className="field"><label htmlFor="i-name">Name</label><input id="i-name" name="name" className="input" required defaultValue={def.name} placeholder="e.g. Family Business Index" style={{ fontFamily: "var(--display)", fontSize: 22 }} /></div>
          <div className="field"><label htmlFor="i-desc">Description</label><textarea id="i-desc" name="description" className="input" rows={2} defaultValue={def.description} placeholder="One sentence shown on the Indexes page" /></div>
        </div>
        <div style={card}>
          <p className="notice" style={{ fontSize: 14 }}><b style={{ fontWeight: 500 }}>Who is included:</b> a fortune {rule}</p>
          <TagPicker name="allTags" title="Must have all of these tags" hint="Narrows the index. Example: Region: Europe and Family business." tags={tags} selected={all} onChange={setAll} />
          <TagPicker name="anyTags" title="…and at least one of these" hint="Optional. Example: Gen Y or Gen Z." tags={tags} selected={any} onChange={setAny} />
        </div>
      </div>
      <aside className="stack min0" style={{ flex: "1 1 min(300px,100%)", ...v("--g", "24px") }}>
        <div style={card}>
          <label className="check"><input type="checkbox" name="published" defaultChecked={def.published} />Published on the Indexes page</label>
          <label className="check"><input type="checkbox" name="featured" defaultChecked={def.featured} />Featured (leads the Indexes and home pages)</label>
          <SaveButton>Save index</SaveButton>
        </div>
        <div style={card}>
          <div className="field"><label htmlFor="i-base">Base year (= 100)</label>
            <select id="i-base" name="baseYear" className="input" defaultValue={def.baseYear ?? ""}><option value="">First year in the data</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
          <div className="field"><label htmlFor="i-color">Chart colour</label><input id="i-color" name="color" type="color" className="input" defaultValue={def.color} style={{ padding: 4, height: 48 }} /></div>
          <div className="field"><label htmlFor="i-order">Order on the page</label><input id="i-order" name="order" type="number" className="input" defaultValue={def.order} /></div>
          <div className="field"><label htmlFor="i-slug">Web address</label><input id="i-slug" name="slug" className="input" defaultValue={def.slug} placeholder="from the name" /><span className="muted" style={{ fontSize: 12 }}>/research/{def.slug || "…"}</span></div>
        </div>
      </aside>
    </form>
  );
}
