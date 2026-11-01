import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { readTable } from "@/lib/sheets";
import { FIELDS, guessMapping } from "@/lib/indexes";
import { AdminNav } from "../../../AdminNav";
import { SaveButton } from "../../../about/fields";
import { confirmImport, cancelImport } from "../../actions";

export const metadata: Metadata = { title: "Admin — Match columns", robots: { index: false } };
export const dynamic = "force-dynamic";
const card: React.CSSProperties = { background: "var(--paper)", padding: "clamp(20px,3vw,32px)", display: "flex", flexDirection: "column", gap: 18 };

export default async function MatchColumns({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params; const sp = await searchParams;
  if (!dbConfigured()) notFound();
  const p = await db.pendingUpload.findUnique({ where: { id } });
  if (!p) notFound();
  let table: string[][] = [];
  let readError = "";
  try { table = await readTable(Buffer.from(p.data), p.filename); } catch { readError = "This file couldn't be read. Please check it opens in Excel, save it as .xlsx or .csv, and upload again."; }
  const head = table[0] ?? [];
  const { mapping, unit, usdColumn } = guessMapping(head);
  const used = new Set(Object.values(mapping));
  // Columns holding only yes/no words (with at least one "yes") are offered as tags and ticked by default.
  const sample = table.slice(1, 300);
  const yesNoCols = head.map((h, i) => ({ h, i })).filter(({ i }) => !used.has(i)
    && sample.every((r) => /^(|yes|no|y|n|true|false|ja|nein|si|sí|oui|non)$/i.test((r[i] ?? "").trim()))
    && sample.some((r) => /^(yes|y|true|ja|si|sí|oui)$/i.test((r[i] ?? "").trim())));
  const otherCols = head.map((h, i) => ({ h, i })).filter(({ i }) => !used.has(i) && !yesNoCols.some((c) => c.i === i));
  const preview = table.slice(1, 6);

  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "24px", paddingTop: 40, maxWidth: 1100 }}>
        <div className="stack" style={{ ["--g" as string]: "6px" }}>
          <Link href="/admin/research#data" className="muted" style={{ fontSize: 13 }}>← Indexes</Link>
          <h1 className="h2">Match your columns<span className="dot">.</span></h1>
        </div>
        <AdminNav current="research" />
        {(sp.error || readError) && <p className="notice err" role="alert" style={{ whiteSpace: "pre-line" }}>{sp.error || readError}</p>}
        {!readError && (
          <>
            <p style={{ color: "var(--ink-body)" }}><b style={{ fontWeight: 500 }}>{p.filename}</b> · {Math.max(0, table.length - 1).toLocaleString("en")} rows · {head.length} columns. We've guessed what each column holds — check the choices, then import.</p>
            {usdColumn != null && <p className="notice err">Column “{head[usdColumn]}” looks like US dollars. The indexes use euros — convert the values before importing, or choose a euro column below.</p>}
            <form action={confirmImport} className="stack" style={{ ["--g" as string]: "24px" }}>
              <input type="hidden" name="id" value={p.id} />
              <div style={card}>
                <h2 className="h3" style={{ fontSize: 22 }}>Which column holds…</h2>
                <div className="grid" style={{ ["--min" as string]: "260px", ["--g" as string]: "16px 24px" }}>
                  {FIELDS.map((f) => (
                    <div key={f.key} className="field">
                      <label htmlFor={`map-${f.key}`}>{f.label}{f.required ? " *" : ""}</label>
                      <select id={`map-${f.key}`} name={`map_${f.key}`} className="input" defaultValue={mapping[f.key] ?? ""} required={f.required}>
                        <option value="">{f.required ? "Choose a column" : "— not in this file —"}</option>
                        {head.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className="field">
                    <label htmlFor="unit">Net worth is written in</label>
                    <select id="unit" name="unit" className="input" defaultValue={unit}>
                      <option value="bn">€ billions (12.4 = €12.4 bn)</option>
                      <option value="m">€ millions (12,400 = €12.4 bn)</option>
                      <option value="eur">euros (12,400,000,000)</option>
                    </select>
                  </div>
                </div>
              </div>

              {(yesNoCols.length > 0 || otherCols.length > 0) && (
                <div style={card}>
                  <h2 className="h3" style={{ fontSize: 22 }}>Turn other columns into tags</h2>
                  <p className="muted" style={{ fontSize: 14 }}>Ticked Yes/No columns become a tag on every “Yes” row (for example “Family business?” → <code>family-business</code>). Other ticked columns become a tag per value (for example “Generation in charge: 2” → <code>generation-in-charge:2</code>).</p>
                  <div className="row" style={{ ["--g" as string]: "8px" }}>
                    {[...yesNoCols, ...otherCols].map(({ h, i }) => (
                      <label key={i} className="tag" style={{ display: "inline-flex", gap: 8, alignItems: "center", minHeight: 40, cursor: "pointer" }}>
                        <input type="checkbox" name="tagColumns" value={i} defaultChecked={yesNoCols.some((c) => c.i === i)} />{h || `Column ${i + 1}`}{yesNoCols.some((c) => c.i === i) && <span className="muted"> · Yes/No</span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={card}>
                <h2 className="h3" style={{ fontSize: 22 }}>First rows of your file</h2>
                <div className="table-box">
                  <table className="table" style={{ fontSize: 13 }}>
                    <thead><tr>{head.map((h, i) => <th key={i} style={{ background: used.has(i) ? "var(--sand)" : undefined }}>{h || `Column ${i + 1}`}</th>)}</tr></thead>
                    <tbody>{preview.map((r, ri) => <tr key={ri}>{head.map((_, i) => <td key={i}>{r[i]}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </div>

              <div className="row" style={{ alignItems: "center" }}>
                <SaveButton>Import and recalculate</SaveButton>
                <button formAction={cancelImport} formNoValidate className="btn btn-ghost">Cancel</button>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
