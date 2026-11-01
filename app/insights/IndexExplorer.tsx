"use client";
import Link from "next/link";
import { useState } from "react";
import type { Point } from "@/lib/indexes";
import { IndexChart, CompareChart } from "@/components/IndexChart";

export type ExplorerIndex = {
  slug: string; name: string; description: string; color: string; series: Point[];
  changePct: number | null; baseYear?: number;
};

const nf1 = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const pct = (n: number | null | undefined) => (n == null ? "—" : `${n >= 0 ? "+" : "−"}${nf1.format(Math.abs(n))}%`);
const bn = (n?: number) => (n == null ? "—" : n >= 1000 ? `€${nf1.format(n / 1000)} tn` : `€${nf1.format(n)} bn`);
const short = (n: string) => n.replace(/ Index$/, "");

/** "Up 55% since 2016 — growth in 7 of 9 years" */
function headline(i: ExplorerIndex) {
  const s = i.series;
  if (s.length < 2) return "The first figures are being prepared";
  const first = s[0], last = s.at(-1)!;
  const total = (last.level / first.level - 1) * 100;
  const up = s.slice(1).filter((p, k) => p.level > s[k].level).length;
  return `${total >= 0 ? "Up" : "Down"} ${Math.abs(Math.round(total))}% since ${first.year} — growth in ${up} of ${s.length - 1} years`;
}

export function IndexExplorer({ indexes }: { indexes: ExplorerIndex[] }) {
  const [view, setView] = useState(indexes[0]?.slug ?? "compare");
  const cur = indexes.find((i) => i.slug === view);
  const last = cur?.series.at(-1);
  return (
    <div className="stack" style={{ ["--g" as string]: "24px" }}>
      <div className="row between" style={{ ["--g" as string]: "16px 32px" }}>
        <div className="stack min0" style={{ ["--g" as string]: "8px" }}>
          <span className="kicker">{cur ? (cur === indexes[0] ? "Featured index" : "Index") : "All indexes"}</span>
          <h2 className="h2" style={{ fontSize: "clamp(30px,4vw,48px)" }}>{cur ? cur.name : "Compare the indexes"}</h2>
          <p className="muted">{cur ? cur.description : "Each index is set to 100 in its base year, so the lines show growth side by side."}</p>
        </div>
        {cur && <Link className="btn btn-dark" href={`/indexes/${cur.slug}`}>Full breakdown →</Link>}
      </div>

      <div className="ix-tabs" role="group" aria-label="Choose an index">
        {indexes.map((i) => {
          const l = i.series.at(-1);
          return (
            <button key={i.slug} type="button" className="ix-tab" aria-pressed={view === i.slug} onClick={() => setView(i.slug)}>
              <span className="ix-tab-name">{short(i.name)}</span>
              <span className="ix-tab-row"><span className="ix-tab-level">{l ? nf1.format(l.level) : "—"}</span><span className="ix-tab-chg">{i.changePct == null ? "" : `${i.changePct >= 0 ? "▲" : "▼"} ${nf1.format(Math.abs(i.changePct))}%`}</span></span>
            </button>
          );
        })}
        <button type="button" className="ix-tab" aria-pressed={view === "compare"} onClick={() => setView("compare")}>
          <span className="ix-tab-name">Compare all</span>
          <span className="ix-tab-row"><span className="ix-tab-level">{indexes.length}</span><span className="ix-tab-chg muted">indexes</span></span>
        </button>
      </div>

      {cur ? (
        <figure className="ix-fig">
          <figcaption className="stack" style={{ ["--g" as string]: "6px" }}>
            <span className="ix-head">{headline(cur)}</span>
            <span className="muted" style={{ fontSize: 13 }}>{cur.baseYear ? `${cur.baseYear} = 100` : ""}{last ? ` · ${last.count.toLocaleString("en")} fortunes · ${bn(last.wealthBn)} in ${last.year}` : ""}</span>
          </figcaption>
          <IndexChart series={cur.series} color={cur.color} label={cur.name} />
          <dl className="ix-kpis">
            <div><dt>Level</dt><dd>{last ? nf1.format(last.level) : "—"}</dd></div>
            <div><dt>1 year</dt><dd>{pct(cur.changePct)}</dd></div>
            <div><dt>Fortunes</dt><dd>{last ? last.count.toLocaleString("en") : "—"}</dd></div>
            <div><dt>Combined wealth</dt><dd>{bn(last?.wealthBn)}</dd></div>
          </dl>
        </figure>
      ) : (
        <figure className="ix-fig">
          <CompareChart lines={indexes.map((i) => ({ name: i.name, color: i.color, series: i.series }))} />
          <ul className="ix-legend">
            {[...indexes].sort((a, b) => (b.series.at(-1)?.level ?? 0) - (a.series.at(-1)?.level ?? 0)).map((i) => (
              <li key={i.slug}><span className="ix-swatch" style={{ background: i.color }} />{short(i.name)} <b>{i.series.at(-1) ? nf1.format(i.series.at(-1)!.level) : "—"}</b></li>
            ))}
          </ul>
        </figure>
      )}
    </div>
  );
}
