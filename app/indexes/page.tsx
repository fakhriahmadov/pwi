import Link from "next/link";
import type { Metadata } from "next";
import { reports as fileReports } from "@/content/reports";
import { db, dbConfigured } from "@/lib/db";
import { getPublishedIndexes, featuredIndex, fmtLevel, fmtPct, fmtBn, datasetSummary } from "@/lib/research";
import { IndexChart } from "@/components/IndexChart";
import { DataRequestForm, ReportDownload } from "./forms";
import { getContent } from "@/lib/content";

// Content comes from the database: refresh at least every 5 minutes (admin saves refresh at once).
export const revalidate = 300;

export const metadata: Metadata = { title: "Indexes", description: "Global indexes and long-run studies of how fortunes are built across industries, countries and generations." };
const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;

export default async function Indexes() {
  const c = await getContent("indexes");
  const dbReports = dbConfigured() ? await db.report.findMany({ where: { status: "published" }, orderBy: [{ date: "desc" }] }).catch(() => []) : [];
  const reports = [...dbReports.map((r) => ({ title: r.title, file: `/media/${r.fileId}`, date: r.date, pages: r.pages ?? undefined, gated: r.gated })), ...fileReports];
  const steps = (Array.isArray(c.steps) ? c.steps : []) as { title?: string; text?: string }[];
  const all = await getPublishedIndexes();
  const feat = featuredIndex(all);
  const data = await datasetSummary();
  return (
    <>
      <section className="dark">
        <div className="wrap stack" style={v("--g", "clamp(40px,5vw,72px)")}>
          <div className="stack" style={v("--g", "20px")}>
            <h1 className="display-xl">Indexes<span className="dot">.</span></h1>
            <p className="lead">{String(c.lead)}</p>
          </div>
          <div className="facts">
            <div className="fact"><span className="label">Indexes</span><span className="fact-big">{all.length || "—"}</span><span className="fact-sub">{all.slice(0, 4).map((i) => i.name.replace(/ Index$/, "")).join(" · ") || "First indexes coming soon"}</span></div>
            <div className="fact"><span className="label">Fortunes tracked</span><span className="fact-big">{data ? data.count.toLocaleString("en") : "—"}</span><span className="fact-sub">{data ? `across ${data.countries} countries` : "worldwide"}</span></div>
            <div className="fact"><span className="label">Latest data</span><span className="fact-big">{data?.year ?? "—"}</span><span className="fact-sub">Updated each edition</span></div>
          </div>
        </div>
      </section>

      {feat ? (
        <section>
          <div className="wrap stack" style={v("--g", "28px")}>
            <div className="row between">
              <div className="stack" style={v("--g", "10px")}><span className="kicker">Featured index</span><h2 className="h2">{feat.name}</h2>{feat.description && <p className="muted">{feat.description}</p>}</div>
              <Link className="more" href={`/indexes/${feat.slug}`}>Full breakdown →</Link>
            </div>
            <div className="grid" style={{ ...v("--min", "200px"), ...v("--g", "16px 32px") }}>
              <Kpi label="Index level" value={fmtLevel(feat.result.latest?.level)} sub={feat.result.baseYear ? `${feat.result.baseYear} = 100` : ""} />
              <Kpi label="Change" value={fmtPct(feat.result.changePct)} sub={feat.result.previous ? `vs ${feat.result.previous.year}` : ""} />
              <Kpi label="Fortunes" value={feat.result.latest?.count.toLocaleString("en") ?? "—"} sub={feat.result.latest ? String(feat.result.latest.year) : ""} />
              <Kpi label="Combined wealth" value={fmtBn(feat.result.latest?.wealthBn)} sub="" />
            </div>
            <div className="paper" style={{ padding: "clamp(16px,3vw,40px)" }}><IndexChart series={feat.result.series} color={feat.color} label={feat.name} /></div>
          </div>
        </section>
      ) : (
        <section><div className="wrap"><div className="paper" style={{ padding: "clamp(24px,3vw,40px)" }}><p className="h3" style={{ fontSize: 22 }}>The first indexes are being prepared.</p><p className="muted" style={{ marginTop: 8 }}>Subscribe at the bottom of any page to receive them on publication.</p></div></div></section>
      )}

      {all.length > 1 && (
        <section className="paper">
          <div className="wrap stack" style={v("--g", "28px")}>
            <div className="stack" style={v("--g", "10px")}><span className="kicker">All indexes</span><h2 className="h2">Explore by theme</h2></div>
            <div className="grid" style={{ ...v("--min", "280px"), ...v("--g", "16px") }}>
              {all.map((i) => (
                <Link key={i.slug} href={`/indexes/${i.slug}`} style={{ background: "var(--paper)", textDecoration: "none", display: "flex", flexDirection: "column", borderTop: `4px solid ${i.color}` }}>
                  <div className="stack" style={{ padding: 24, ...v("--g", "10px"), flexGrow: 1 }}>
                    <span className="h3" style={{ fontSize: 22 }}>{i.name}</span>
                    {i.description && <span className="muted" style={{ fontSize: 14 }}>{i.description}</span>}
                    <div className="row" style={{ ...v("--g", "8px 20px"), alignItems: "baseline", marginTop: "auto", paddingTop: 8 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 300, letterSpacing: "-.03em" }}>{fmtLevel(i.result.latest?.level)}</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{fmtPct(i.result.changePct)}</span>
                      <span className="muted" style={{ fontSize: 13 }}>{i.result.latest ? `${i.result.latest.count.toLocaleString("en")} fortunes` : "No data yet"}</span>
                    </div>
                  </div>
                  <div style={{ padding: "0 24px 20px" }}><IndexChart series={i.result.series} color={i.color} spark label={i.name} /></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="dark">
        <div className="wrap stack" style={v("--g", "40px")}>
          <div className="stack" style={v("--g", "10px")}><span className="kicker">Methodology</span><h2 className="h2">{String(c.methodTitle)}</h2></div>
          <ol className="grid" style={{ listStyle: "none", margin: 0, padding: 0, ...v("--min", "220px"), ...v("--g", "32px") }}>
            {steps.map((st, n) => [st.title ?? "", st.text ?? ""]).map(([t, d], n) => (
              <li key={n} className="fact"><span className="fact-big" style={{ fontSize: 40 }}>{String(n + 1).padStart(2, "0")}</span><span className="h3" style={{ fontSize: 20 }}>{t}</span><span style={{ color: "var(--stone)" }}>{d}</span></li>
            ))}
          </ol>
        </div>
      </section>

      <section>
        <div className="wrap row" style={{ ...v("--g", "40px 80px"), alignItems: "flex-start" }}>
          <div className="stack min0" style={{ flex: "2 1 min(560px, 100%)", ...v("--g", "20px") }}>
            <span className="kicker">Reports</span>
            <h2 className="h2">Editions &amp; studies</h2>
            {reports.length === 0 ? <p className="muted">No reports published yet. The first edition will appear here.</p> : (
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

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="stack" style={{ borderTop: "1px solid var(--ink)", paddingTop: 14, ["--g" as string]: "4px" }}><span className="label">{label}</span><span className="fact-big">{value}</span>{sub && <span className="muted" style={{ fontSize: 13 }}>{sub}</span>}</div>;
}
