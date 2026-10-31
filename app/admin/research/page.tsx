import Link from "next/link";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { tagCounts } from "@/lib/indexes";
import { AdminNav } from "../AdminNav";
import { SaveButton, DeleteButton } from "../about/fields";
import { uploadData, deleteYear, createStarters } from "./actions";
import { tagLabel } from "@/lib/indexes";

export const metadata: Metadata = { title: "Admin — Research", robots: { index: false } };
export const dynamic = "force-dynamic";
const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;
const card: React.CSSProperties = { background: "var(--white)", padding: "clamp(20px,3vw,32px)", display: "flex", flexDirection: "column", gap: 18 };
const nf = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });

export default async function AdminResearch({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  if (!dbConfigured()) return <section className="admin"><div className="wrap"><p className="notice err">Set DATABASE_URL and run <code>npm run db:push</code> to manage research data.</p></div></section>;
  const [years, uploads, indexes, tags] = await Promise.all([
    db.fortune.groupBy({ by: ["year"], _count: true, _sum: { netWorthBn: true }, orderBy: { year: "desc" } }),
    db.dataUpload.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.indexDef.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    tagCounts(),
  ]);
  const groups = ["", "region", "generation", "industry", "gender", "country"].map((p) => ({
    p, title: p ? tagLabel(`${p}:x`).split(":")[0] : "Your tags",
    list: tags.filter((t) => (p ? t.tag.startsWith(p + ":") : !t.tag.includes(":"))),
  })).filter((g) => g.list.length);

  return (
    <section className="admin">
      <div className="wrap stack" style={{ ...v("--g", "40px"), paddingTop: 40, maxWidth: 1100 }}>
        <div className="stack" style={v("--g", "16px")}>
          <div className="row between" style={{ alignItems: "center" }}>
            <h1 className="h2">Research<span className="dot">.</span></h1>
            <Link className="btn btn-red" href="/admin/research/new">New index</Link>
          </div>
          <AdminNav current="research" />
          {sp.ok && <p className="notice okay" role="status">{sp.ok}.</p>}
          {sp.error && <p className="notice err" role="alert" style={{ whiteSpace: "pre-line" }}>{sp.error}</p>}
          <nav aria-label="On this page" className="row" style={{ ...v("--g", "4px 20px"), fontSize: 14 }}><a href="#data">Data</a><a href="#indexes">Indexes</a><a href="#tags">Tags</a></nav>
        </div>

        <section id="data" className="stack" style={v("--g", "16px")}>
          <div><h2 className="h3" style={{ fontSize: 26 }}>Data</h2><p className="muted" style={{ fontSize: 14, maxWidth: "75ch" }}>Upload a CSV with one row per fortune per year. Uploading a year that already exists replaces that year. Region, country, industry, generation and gender tags are added automatically; add your own in the <code>tags</code> column, separated by semicolons.</p></div>
          <form action={uploadData} style={card}>
            <div className="row" style={{ ...v("--g", "16px"), alignItems: "flex-end" }}>
              <div className="field"><label htmlFor="csv">CSV file</label><input id="csv" name="file" type="file" accept=".csv,text/csv" required className="input" style={{ paddingTop: 10 }} /></div>
              <SaveButton>Upload and recalculate</SaveButton>
            </div>
            <details>
              <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 500 }}>Which columns does the file need?</summary>
              <div className="table-box" style={{ marginTop: 12 }}>
                <table className="table" style={{ fontSize: 14 }}>
                  <thead><tr><th>Column</th><th>Required</th><th>Example</th></tr></thead>
                  <tbody>
                    <tr><td><code>year</code></td><td>Yes</td><td>2025</td></tr>
                    <tr><td><code>country</code></td><td>Yes</td><td>Spain</td></tr>
                    <tr><td><code>net_worth_eur_bn</code></td><td>Yes — euros, in billions</td><td>12.4</td></tr>
                    <tr><td><code>name</code></td><td>No — never shown publicly</td><td>Example Person A</td></tr>
                    <tr><td><code>industry</code></td><td>No</td><td>Retail</td></tr>
                    <tr><td><code>birth_year</code></td><td>No — sets the generation</td><td>1958</td></tr>
                    <tr><td><code>gender</code></td><td>No</td><td>female</td></tr>
                    <tr><td><code>region</code></td><td>No — worked out from the country</td><td>Europe</td></tr>
                    <tr><td><code>tags</code></td><td>No</td><td>family-business; self-made</td></tr>
                  </tbody>
                </table>
              </div>
              <a className="more" href="/admin/research/sample.csv" style={{ display: "inline-block", marginTop: 12 }}>Download a template CSV</a>
            </details>
          </form>
          {years.length > 0 && (
            <div className="table-box" style={{ background: "var(--white)" }}>
              <table className="table" style={{ fontSize: 14 }}>
                <thead><tr><th>Year</th><th>Fortunes</th><th>Combined wealth</th><th></th></tr></thead>
                <tbody>{years.map((y) => (
                  <tr key={y.year}><td style={{ fontWeight: 500 }}>{y.year}</td><td>{y._count.toLocaleString("en")}</td><td>€{nf.format(y._sum.netWorthBn ?? 0)} bn</td>
                    <td><form action={deleteYear}><input type="hidden" name="year" value={y.year} /><DeleteButton label={`all ${y.year} data`} /></form></td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {uploads.length > 0 && <p className="muted" style={{ fontSize: 13 }}>Recent uploads: {uploads.map((u) => `${u.filename} (${u.rows} rows, ${u.years.join("/")}, ${u.createdAt.toISOString().slice(0, 10)})`).join(" · ")}</p>}
        </section>

        <section id="indexes" className="stack" style={v("--g", "16px")}>
          <div><h2 className="h3" style={{ fontSize: 26 }}>Indexes</h2><p className="muted" style={{ fontSize: 14 }}>Each index is a saved tag filter. Only published indexes appear on the Research page; the featured one leads the page.</p></div>
          {indexes.length === 0 && (
            <form action={createStarters} className="notice row between" style={{ alignItems: "center" }}>
              <span>Start with six indexes — Global, EuroCapital, Family Business, Gen X, Gen Y and Gen Z — then edit them.</span>
              <SaveButton>Create starter indexes</SaveButton>
            </form>
          )}
          {indexes.length > 0 && (
            <div className="table-box" style={{ background: "var(--white)" }}>
              <table className="table" style={{ fontSize: 14, minWidth: 720 }}>
                <thead><tr><th>Index</th><th>Rule</th><th>Status</th><th></th></tr></thead>
                <tbody>{indexes.map((i) => (
                  <tr key={i.id}>
                    <td><span style={{ display: "inline-block", width: 10, height: 10, background: i.color, marginRight: 8 }} aria-hidden="true" /><Link href={`/admin/research/${i.id}`} style={{ fontWeight: 500 }}>{i.name}</Link>{i.featured && <> <span className="pill PAID">Featured</span></>}</td>
                    <td style={{ fontSize: 13 }}>{i.allTags.length || i.anyTags.length ? [i.allTags.length ? `All of: ${i.allTags.map(tagLabel).join(", ")}` : "", i.anyTags.length ? `Any of: ${i.anyTags.map(tagLabel).join(", ")}` : ""].filter(Boolean).join(" · ") : "Every fortune"}</td>
                    <td><span className={`pill ${i.published ? "PAID" : "PENDING_APPROVAL"}`}>{i.published ? "Published" : "Draft"}</span></td>
                    <td style={{ whiteSpace: "nowrap" }}><Link href={`/admin/research/${i.id}`}>Edit</Link>{i.published && <> · <a href={`/research/${i.slug}`} target="_blank">View ↗</a></>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>

        <section id="tags" className="stack" style={v("--g", "16px")}>
          <div><h2 className="h3" style={{ fontSize: 26 }}>Tags in the data</h2><p className="muted" style={{ fontSize: 14 }}>How many fortunes carry each tag in the latest year. Use these when defining indexes.</p></div>
          {tags.length === 0 ? <p className="muted">No data uploaded yet.</p> : (
            <div style={card}>
              {groups.map((g) => (
                <div key={g.p} className="stack" style={v("--g", "8px")}>
                  <span className="label-s">{g.title}</span>
                  <div className="row" style={v("--g", "6px")}>{g.list.map((t) => <span key={t.tag} className="tag">{t.label.replace(/^[^:]+:\s/, "")} <span className="muted">· {t.count}</span></span>)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
