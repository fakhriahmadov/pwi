import type { Metadata } from "next";
import { getRanking, getSeries, type Point } from "@/lib/index-data";
import { reports } from "@/content/reports";
import { DataRequestForm, ReportDownload } from "./forms";

export const metadata: Metadata = { title: "Research — EuroCapital Index", description: "The EuroCapital Index and long-run studies of how fortunes are built across industries, countries and generations." };
const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;
const nf = new Intl.NumberFormat("en-GB");

function Chart({ points }: { points: Point[] }) {
  const W = 1000, H = 300, P = 40;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i: number) => P + (i / Math.max(1, points.length - 1)) * (W - P * 2);
  const y = (val: number) => H - P - ((val - min) / span) * (H - P * 2);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label={`EuroCapital Index from ${points[0].date} to ${last.date}, latest value ${last.value}`}>
      {[0, 0.5, 1].map((t) => <g key={t}><line x1={P} x2={W - P} y1={y(min + span * t)} y2={y(min + span * t)} stroke="#E3DCCF" /><text x={P - 8} y={y(min + span * t) + 4} fontSize="12" textAnchor="end" fill="#5E5A54">{Math.round(min + span * t)}</text></g>)}
      <path d={`${d} L${x(points.length - 1)},${H - P} L${x(0)},${H - P} Z`} fill="#E5484A" fillOpacity=".08" />
      <path d={d} fill="none" stroke="#C42F33" strokeWidth="3" />
      <circle cx={x(points.length - 1)} cy={y(last.value)} r="6" fill="#C42F33" />
      <text x={P} y={H - 12} fontSize="12" fill="#5E5A54">{points[0].date.slice(0, 4)}</text>
      <text x={W - P} y={H - 12} fontSize="12" textAnchor="end" fill="#5E5A54">{last.date.slice(0, 4)}</text>
    </svg>
  );
}

export default function Research() {
  const series = getSeries();
  const ranking = getRanking();
  const last = series.at(-1), prev = series.at(-2);
  const change = last && prev ? ((last.value - prev.value) / prev.value) * 100 : null;
  const edition = ranking[0]?.edition;
  return (
    <>
      <section className="dark">
        <div className="wrap stack" style={v("--g", "clamp(40px,5vw,72px)")}>
          <div className="stack" style={v("--g", "20px")}>
            <h1 className="display-xl">Research<span className="dot">.</span></h1>
            <p className="lead">The EuroCapital Index and long-run studies of how fortunes are built across industries, countries and generations.</p>
          </div>
          <div className="facts">
            <div className="fact"><span className="label">Index level</span><span className="fact-big">{last ? nf.format(last.value) : "—"}</span><span className="fact-sub">{last ? `As of ${last.date}` : "First edition coming soon"}</span></div>
            <div className="fact"><span className="label">Change</span><span className="fact-big">{change == null ? "—" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}</span><span className="fact-sub">vs previous reading</span></div>
            <div className="fact"><span className="label">Countries</span><span className="fact-big">{ranking.length || "—"}</span><span className="fact-sub">{edition ? `${edition} edition` : "in the index"}</span></div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap stack" style={v("--g", "28px")}>
          <div className="stack" style={v("--g", "10px")}><span className="kicker">EuroCapital Index</span><h2 className="h2">Explore the data</h2></div>
          {series.length > 1 ? (
            <div className="paper stack" style={{ padding: "clamp(20px,3vw,40px)", ...v("--g", "16px") }}>
              <span className="h3" style={{ fontSize: 20 }}>Index over time</span>
              <Chart points={series} />
            </div>
          ) : (
            <div className="paper" style={{ padding: "clamp(24px,3vw,40px)" }}>
              <p className="h3" style={{ fontSize: 22 }}>The first edition of the index is being prepared.</p>
              <p className="muted" style={{ marginTop: 8 }}>Subscribe at the bottom of any page to receive it on publication.</p>
            </div>
          )}
          {ranking.length > 0 && (
            <div className="table-box">
              <table className="table" style={{ minWidth: 720 }}>
                <caption style={{ textAlign: "left", padding: "16px 0", fontSize: 13, color: "var(--muted)" }}>Ranking by country — {edition} edition</caption>
                <thead><tr><th scope="col">Rank</th><th scope="col">Country</th><th scope="col">Billionaires</th><th scope="col">Combined wealth</th><th scope="col">Change</th><th scope="col">Leading industry</th></tr></thead>
                <tbody>
                  {ranking.map((r, i) => (
                    <tr key={r.country}><td style={{ fontFamily: "var(--display)", fontWeight: 500 }}>{i + 1}</td><td style={{ fontWeight: 500 }}>{r.country}</td><td>{nf.format(r.billionaires)}</td><td>€{nf.format(r.wealthBn)} bn</td><td>{r.changePct >= 0 ? "+" : ""}{r.changePct}%</td><td>{r.leadingIndustry}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="dark">
        <div className="wrap stack" style={v("--g", "40px")}>
          <div className="stack" style={v("--g", "10px")}><span className="kicker">Methodology</span><h2 className="h2">How the index is built</h2></div>
          <ol className="grid" style={{ listStyle: "none", margin: 0, padding: 0, ...v("--min", "240px"), ...v("--g", "32px") }}>
            {[
              ["Sources", "Public wealth rankings, company filings and the institute's own research."],
              ["Classification", "Each fortune is assigned to a country, an industry and a generation."],
              ["Weighting", "Country scores combine the number of billionaires and their combined wealth."],
              ["Review", "Each edition is reviewed and revised figures are published with the next one."],
            ].map(([t, d], i) => (
              <li key={t} className="fact"><span className="fact-big" style={{ fontSize: 40 }}>{String(i + 1).padStart(2, "0")}</span><span className="h3" style={{ fontSize: 20 }}>{t}</span><span style={{ color: "var(--ondark-2)" }}>{d}</span></li>
            ))}
          </ol>
        </div>
      </section>

      <section>
        <div className="wrap row" style={{ ...v("--g", "40px 80px"), alignItems: "flex-start" }}>
          <div className="stack min0" style={{ flex: "2 1 min(560px, 100%)", ...v("--g", "20px") }}>
            <span className="kicker">Reports</span>
            <h2 className="h2">Editions &amp; studies</h2>
            {reports.length === 0 ? (
              <p className="muted">No reports published yet. The first EuroCapital Index report will appear here.</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid var(--line)" }}>
                {reports.map((r) => (
                  <li key={r.file} className="row between" style={{ padding: "20px 0", borderBottom: "1px solid var(--line)", alignItems: "center", ...v("--g", "12px 24px") }}>
                    <span className="stack" style={v("--g", "0")}><span className="h3" style={{ fontSize: 21 }}>{r.title}</span><span className="muted" style={{ fontSize: 13 }}>PDF{r.pages ? ` · ${r.pages} pages` : ""} · {r.date}</span></span>
                    {r.gated ? <ReportDownload title={r.title} file={r.file} /> : <a href={r.file} style={{ fontSize: 13, fontWeight: 600 }}>Download</a>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DataRequestForm />
        </div>
      </section>
    </>
  );
}
