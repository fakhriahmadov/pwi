import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublishedIndexes, fmtLevel, fmtPct, fmtBn } from "@/lib/research";
import { tagLabel, type Breakdown } from "@/lib/indexes";
import { IndexChart } from "@/components/IndexChart";

type P = { params: Promise<{ slug: string }> };
const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const slug = (await params).slug;
  const i = (await getPublishedIndexes()).find((x) => x.slug === slug);
  return i ? { title: i.name, description: i.description || `${i.name} — Private Wealth Institute` } : {};
}

function Bars({ title, rows, color }: { title: string; rows: Breakdown; color: string }) {
  if (!rows.length) return null;
  return (
    <div className="stack min0" style={v("--g", "12px")}>
      <h3 className="h3" style={{ fontSize: 20 }}>{title}</h3>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => (
          <li key={r.label} className="stack" style={v("--g", "4px")}>
            <div className="row between" style={{ ...v("--g", "8px"), fontSize: 14, alignItems: "baseline" }}><span style={{ fontWeight: 500 }}>{r.label}</span><span className="muted" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtBn(r.wealthBn)} · {r.count}</span></div>
            <div style={{ height: 6, background: "var(--sand-2)" }} aria-hidden="true"><div style={{ height: 6, width: `${Math.max(1, r.share * 100)}%`, background: color }} /></div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function IndexPage({ params }: P) {
  const { slug } = await params;
  const all = await getPublishedIndexes();
  const i = all.find((x) => x.slug === slug);
  if (!i) notFound();
  const r = i.result;
  const rule = !i.allTags.length && !i.anyTags.length ? "every fortune in the dataset" :
    [i.allTags.length && i.allTags.map(tagLabel).join(" and "), i.anyTags.length && `any of ${i.anyTags.map(tagLabel).join(", ")}`].filter(Boolean).join(", plus ");
  return (
    <>
      <section className="dark">
        <div className="wrap stack" style={v("--g", "clamp(32px,5vw,56px)")}>
          <div className="stack" style={v("--g", "16px")}>
            <Link href="/insights#indexes" className="kicker" style={{ textDecoration: "none" }}>← Insights · all indexes</Link>
            <h1 className="display-l">{i.name}<span style={{ color: i.color === "#0A0A0A" ? "var(--red-dark)" : i.color }}>.</span></h1>
            {i.description && <p className="lead">{i.description}</p>}
          </div>
          <div className="facts">
            <div className="fact"><span className="label">Index level</span><span className="fact-big">{fmtLevel(r.latest?.level)}</span><span className="fact-sub">{r.baseYear ? `${r.baseYear} = 100` : "No data yet"}</span></div>
            <div className="fact"><span className="label">Change</span><span className="fact-big">{fmtPct(r.changePct)}</span><span className="fact-sub">{r.previous ? `${r.previous.year} → ${r.latest?.year}` : ""}</span></div>
            <div className="fact"><span className="label">Fortunes</span><span className="fact-big">{r.latest?.count.toLocaleString("en") ?? "—"}</span><span className="fact-sub">{r.latest ? `in ${r.latest.year}` : ""}</span></div>
            <div className="fact"><span className="label">Combined wealth</span><span className="fact-big">{fmtBn(r.latest?.wealthBn)}</span><span className="fact-sub">{r.latest ? `in ${r.latest.year}` : ""}</span></div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap stack" style={v("--g", "24px")}>
          <div className="stack" style={v("--g", "8px")}><span className="kicker">Over time</span><h2 className="h2">Index level</h2><p className="muted" style={{ fontSize: 14 }}>Includes {rule}.</p></div>
          <div className="paper" style={{ padding: "clamp(16px,3vw,40px)" }}><IndexChart series={r.series} color={i.color} label={i.name} /></div>
          {r.series.length > 0 && (
            <details className="faq" style={{ borderTop: "1px solid var(--ink)" }}>
              <summary>
                <span>Show yearly figures <span className="muted" style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 400 }}>({r.series.length} {r.series.length === 1 ? "year" : "years"})</span></span>
                <span className="plus" aria-hidden="true">+</span>
              </summary>
            <div className="table-box" style={{ borderTop: 0, marginBottom: 16 }}>
              <table className="table">
                <thead><tr><th>Year</th><th>Index level</th><th>Fortunes</th><th>Combined wealth</th></tr></thead>
                <tbody>{[...r.series].reverse().map((p) => <tr key={p.year}><td style={{ fontWeight: 500 }}>{p.year}</td><td>{fmtLevel(p.level)}</td><td>{p.count.toLocaleString("en")}</td><td>{fmtBn(p.wealthBn)}</td></tr>)}</tbody>
              </table>
            </div>
            </details>
          )}
        </div>
      </section>

      {r.latest && (
        <section className="paper">
          <div className="wrap stack" style={v("--g", "32px")}>
            <div className="stack" style={v("--g", "8px")}><span className="kicker">Breakdown · {r.latest.year}</span><h2 className="h2">Where the wealth sits</h2><p className="muted" style={{ fontSize: 14 }}>Combined wealth and number of fortunes. Top ten in each view.</p></div>
            <div className="grid" style={{ ...v("--min", "260px"), ...v("--g", "40px 48px") }}>
              <Bars title="By region" rows={r.byRegion} color={i.color} />
              <Bars title="By country" rows={r.byCountry} color={i.color} />
              <Bars title="By industry" rows={r.byIndustry} color={i.color} />
              <Bars title="By generation" rows={r.byGeneration} color={i.color} />
            </div>
          </div>
        </section>
      )}

      {all.length > 1 && (
        <section><div className="wrap tight stack" style={v("--g", "16px")}>
          <span className="kicker">Other indexes</span>
          <div className="row" style={v("--g", "8px")}>{all.filter((x) => x.slug !== i.slug).map((x) => <Link key={x.slug} className="chip" href={`/indexes/${x.slug}`}>{x.name}</Link>)}</div>
        </div></section>
      )}
    </>
  );
}
