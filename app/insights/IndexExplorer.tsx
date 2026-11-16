"use client";
import Link from "next/link";
import { useState } from "react";
import type { Point } from "@/lib/indexes";

export type ExplorerIndex = {
  slug: string; name: string; description: string; color: string; series: Point[];
  changePct: number | null; baseYear?: number;
};

/* Ported from the final prototype's Insights explorer: index tabs, the single-index chart with a
   year read-out and year-on-year bars, and the "Compare all" chart. */

const short = (n: string) => n.replace(/ Index$/, "");
const P = (v: number) => (v / 10).toFixed(2) + "%";
const pct = (x: number) => (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(1) + "%";
const fmtW = (bn: number) => (bn >= 1000 ? "€" + (bn / 1000).toFixed(1) + " tn" : "€" + Math.round(bn) + " bn");
const GD = "'Space Grotesk', sans-serif";
const NUM: React.CSSProperties = { fontFamily: GD, fontSize: "clamp(18px, 2.4vw, 22px)", fontWeight: 500, fontVariantNumeric: "tabular-nums" };
const COMPARE_STYLES: [string, string, number][] = [["#0A0A0A", "", 3], ["#C42F33", "", 3], ["#5E5A54", "10 6", 2.5], ["#8C877F", "2 6", 3], ["#3D3B38", "14 5 3 5", 2.5], ["#B5B0A8", "4 4", 2.5]];

function change(i: ExplorerIndex) {
  const s = i.series;
  if (s.length < 2) return null;
  return (s.at(-1)!.level / s.at(-2)!.level - 1) * 100;
}

function tcard(on: boolean): React.CSSProperties {
  return { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between", gap: 10, minHeight: 84, padding: "12px 14px", boxSizing: "border-box", textAlign: "left", font: "inherit", border: 0, cursor: "pointer",
    background: on ? "#0A0A0A" : "#F6F2EA", color: on ? "#FFFFFF" : "#0A0A0A", boxShadow: on ? "inset 0 -3px 0 #E5484A" : "none" };
}

export function IndexExplorer({ indexes }: { indexes: ExplorerIndex[] }) {
  const [view, setView] = useState(indexes[0]?.slug ?? "compare");
  const [hover, setHover] = useState<number | null>(null);
  const [anim, setAnim] = useState(0);
  const pick = (v: string) => { setView(v); setHover(null); setAnim((a) => a + 1); };
  const cur = indexes.find((i) => i.slug === view) ?? indexes[0];
  const isCompare = view === "compare";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--red)" }}>{isCompare ? "All indexes" : cur === indexes[0] ? "Featured index" : "Index"}</span>
          <h2 style={{ margin: 0, fontFamily: GD, fontWeight: 400, fontSize: "clamp(28px, 6vw, 56px)", lineHeight: 1, letterSpacing: "-.035em" }}>{isCompare ? "How the indexes compare" : cur.name}</h2>
          <p style={{ margin: 0, color: "var(--ink-muted)" }}>{isCompare ? `Index level, ${indexes[0]?.baseYear ?? "base year"} = 100 — the higher the line, the faster that group’s wealth grew.` : cur.description}</p>
        </div>
        <Link href={`/indexes/${isCompare ? indexes[0].slug : cur.slug}`} style={{ display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 20px", background: "var(--ink)", color: "var(--paper)", fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", textDecoration: "none" }}>Full breakdown →</Link>
      </div>

      <div role="group" aria-label="Choose an index" className="tabs">
        {indexes.map((i) => {
          const on = view === i.slug, c = change(i), up = c == null || c >= 0;
          return (
            <button key={i.slug} type="button" className="tab" aria-pressed={on} onClick={() => pick(i.slug)} style={tcard(on)}>
              <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.25 }}>{short(i.name)}</span>
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "2px 8px", width: "100%" }}>
                <span style={{ fontFamily: GD, fontSize: 22, fontWeight: 400, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{i.series.at(-1)?.level.toFixed(1) ?? "—"}</span>
                {c != null && <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", color: up ? (on ? "#FFFFFF" : "#0A0A0A") : (on ? "#E5484A" : "#C42F33") }}>{(up ? "▲ " : "▼ ") + Math.abs(c).toFixed(1) + "%"}</span>}
              </span>
            </button>
          );
        })}
        {indexes.length > 1 && (
          <button type="button" className="tab" aria-pressed={isCompare} onClick={() => pick("compare")} style={tcard(isCompare)}>
            <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.25 }}>Compare all</span>
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "2px 8px", width: "100%" }}>
              <span style={{ fontFamily: GD, fontSize: 22, fontWeight: 400, lineHeight: 1 }}>{indexes.length}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: isCompare ? "#B5B0A8" : "#5E5A54" }}>indexes</span>
            </span>
          </button>
        )}
      </div>

      {isCompare ? <Compare key={anim} indexes={indexes} hover={hover} setHover={setHover} /> : cur.series.length >= 2 ? <Single key={anim} i={cur} hover={hover} setHover={setHover} /> : (
        <figure style={{ margin: 0, background: "var(--sand)", padding: "clamp(18px, 3vw, 40px)" }}><figcaption style={{ fontFamily: GD, fontSize: 22 }}>The first figures are being prepared.</figcaption></figure>
      )}
    </div>
  );
}

function Single({ i, hover, setHover }: { i: ExplorerIndex; hover: number | null; setHover: (k: number | null) => void }) {
  const pts = i.series, nP = pts.length;
  const kSel = hover != null && hover < nP ? hover : nP - 1;
  const vals = pts.map((p) => p.level);
  let lo = Math.min(...vals, 100), hi = Math.max(...vals);
  const step = hi - lo > 120 ? 50 : hi - lo > 50 ? 20 : 10;
  lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step; if (hi === lo) hi += step;
  const cx = (k: number) => ((k + 0.5) / nP) * 1000, cy = (v: number) => ((hi - v) / (hi - lo)) * 1000;
  const cline = pts.map((p, k) => cx(k).toFixed(1) + "," + cy(p.level).toFixed(1)).join(" ");
  const yoy = pts.map((p, k) => (k === 0 ? null : (p.level / pts[k - 1].level - 1) * 100));
  const ups = yoy.filter((x) => x != null && x >= 0).length;
  let worstK = -1; yoy.forEach((x, k) => { if (x != null && x < 0 && (worstK < 0 || x < yoy[worstK]!)) worstK = k; });
  let bestK = -1; yoy.forEach((x, k) => { if (x != null && (bestK < 0 || x > yoy[bestK]!)) bestK = k; });
  const total = (pts[nP - 1].level / pts[0].level - 1) * 100;
  const sel = pts[kSel], ySel = yoy[kSel];
  const ticks: number[] = []; for (let t = lo; t <= hi + 0.01; t += step) ticks.push(t);
  const hitW = 1000 / nP;
  const mxU = Math.max(...yoy.filter((x): x is number => x != null && x > 0), 0.1), mxD = Math.max(...yoy.filter((x): x is number => x != null && x < 0).map(Math.abs), 0);
  const tot = 96, upH = Math.round((tot * mxU) / (mxU + mxD)), downH = tot - upH, mx = Math.max(mxU, mxD);
  const H = "clamp(220px, 34vw, 360px)";
  const sub = [bestK > 0 ? `Best year ${pts[bestK].year} (${pct(yoy[bestK]!)})` : "", worstK > 0 ? `sharpest fall ${pts[worstK].year} (${pct(yoy[worstK]!)})` : "", "values in euro"].filter(Boolean).join(" · ");
  const cells = [
    { k: "Index level", v: sel.level.toFixed(1), red: false },
    { k: ySel == null ? "Change" : `vs ${pts[kSel - 1].year}`, v: ySel == null ? "Start year" : pct(ySel), red: ySel != null && ySel < 0 },
    { k: "Combined wealth", v: fmtW(sel.wealthBn), red: false },
    { k: "Fortunes", v: sel.count.toLocaleString("en-GB"), red: false },
  ];

  return (
    <figure style={{ margin: 0, background: "var(--sand)", padding: "clamp(18px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: "clamp(16px, 2.4vw, 24px)" }}>
      <figcaption style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontFamily: GD, fontSize: "clamp(20px, 2.6vw, 28px)", fontWeight: 500, lineHeight: 1.2, letterSpacing: "-.015em" }}>{`${total >= 0 ? "Up" : "Down"} ${Math.abs(total).toFixed(0)}% since ${pts[0].year} — growth in ${ups} of ${nP - 1} years`}</span>
        <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{sub}</span>
      </figcaption>

      <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "stretch", background: "var(--paper)" }}>
        <div style={{ flex: "none", padding: "14px clamp(12px, 2vw, 18px)", background: "var(--ink)", color: "var(--paper)", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 76, boxSizing: "border-box" }}>
          <span style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--stone-2)" }}>{kSel === nP - 1 ? "Latest" : "Year"}</span>
          <span style={{ fontFamily: GD, fontSize: 28, fontWeight: 500, lineHeight: 1.1 }}>{sel.year}</span>
        </div>
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))" }}>
          {cells.map((c) => (
            <div key={c.k} style={{ padding: "10px clamp(12px, 2vw, 18px)", display: "flex", flexDirection: "column", gap: 2, boxShadow: "inset 1px 0 0 var(--sand-2), inset 0 -1px 0 var(--sand-2)" }}>
              <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{c.k}</span><span style={{ ...NUM, color: c.red ? "#C42F33" : "#0A0A0A" }}>{c.v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chartgrid" style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr)", columnGap: 10 }}>
        <div style={{ position: "relative", height: H }} aria-hidden="true">
          {ticks.map((v) => <span key={v} style={{ position: "absolute", right: 0, top: P(cy(v)), transform: "translateY(-50%)", fontSize: 12, color: v === 100 ? "#0A0A0A" : "#5E5A54", fontWeight: v === 100 ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>{v}</span>)}
        </div>
        <div style={{ position: "relative", height: H }} onMouseLeave={() => setHover(null)}>
          {ticks.map((v) => <div key={v} style={{ position: "absolute", left: 0, right: 0, top: P(cy(v)), borderTop: v === 100 ? "1px dashed #8C877F" : "1px solid #E3DCCF" }} />)}
          {cy(100) <= 1000 && <span style={{ position: "absolute", right: 6, top: P(cy(100)), transform: `translateY(${cy(100) > 900 ? "-120%" : "4px"})`, fontSize: 11, color: "#5E5A54", background: "#F6F2EA", padding: "0 4px" }}>Start = 100</span>}
          <svg className="rv" viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} role="img" aria-label={`${i.name}: index level from ${pts[0].year} (100) to ${pts[nP - 1].year} (${pts[nP - 1].level.toFixed(1)})`}>
            <path d={"M" + cline.split(" ").join(" L") + ` L${cx(nP - 1).toFixed(1)},1000 L${cx(0).toFixed(1)},1000 Z`} fill="#0A0A0A" fillOpacity=".07" />
            <polyline points={cline} fill="none" stroke="#0A0A0A" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          <div style={{ position: "absolute", top: 0, bottom: 0, width: 0, borderLeft: "1px solid rgba(10,10,10,.35)", pointerEvents: "none", left: P(cx(kSel)) }} />
          {pts.map((p, k) => {
            const on = k === kSel, last = k === nP - 1, down = yoy[k] != null && yoy[k]! < 0, d = on ? 14 : last ? 12 : 8;
            return <span key={p.year} style={{ position: "absolute", pointerEvents: "none", left: P(cx(k)), top: P(cy(p.level)), width: d, height: d, margin: `-${d / 2}px 0 0 -${d / 2}px`, borderRadius: "50%", boxSizing: "border-box", transition: "all .2s", background: on ? "#FFFFFF" : down ? "#C42F33" : "#0A0A0A", border: on ? `3px solid ${down ? "#C42F33" : "#0A0A0A"}` : "2px solid #F6F2EA" }} />;
          })}
          <span style={{ position: "absolute", pointerEvents: "none", right: 0, top: P(cy(pts[nP - 1].level)), transform: "translate(0, -170%)", background: "#0A0A0A", color: "#FFFFFF", fontSize: 12, fontWeight: 600, padding: "3px 8px", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{pts[nP - 1].year}: {pts[nP - 1].level.toFixed(1)}</span>
          {worstK > 0 && worstK !== kSel && <span style={{ position: "absolute", pointerEvents: "none", left: P(cx(worstK)), top: P(cy(pts[worstK].level)), transform: "translate(-50%, 14px)", fontSize: 12, fontWeight: 600, color: "#C42F33", whiteSpace: "nowrap", background: "#F6F2EA", padding: "0 4px" }}>{pct(yoy[worstK]!)} in {pts[worstK].year}</span>}
          {pts.map((p, k) => {
            const l = Math.max(0, cx(k) - hitW / 2), r = Math.min(1000, cx(k) + hitW / 2);
            return <button key={p.year} type="button" aria-label={`${p.year}: index ${p.level.toFixed(1)}`} onMouseEnter={() => setHover(k)} onFocus={() => setHover(k)} onClick={() => setHover(k)} style={{ position: "absolute", top: 0, bottom: 0, left: P(l), width: P(r - l), background: "transparent", border: 0, padding: 0, cursor: "crosshair" }} />;
          })}
        </div>
        <div />
        <div style={{ position: "relative", height: 22, marginTop: 8 }} aria-hidden="true">
          {pts.map((p, k) => {
            const show = nP <= 6 || (nP - 1 - k) % 2 === 0;
            return <span key={p.year} style={{ position: "absolute", top: 0, left: P(cx(k)), transform: "translateX(-50%)", fontSize: 12, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", color: k === kSel ? "#0A0A0A" : "#5E5A54", fontWeight: k === kSel ? 600 : 400, visibility: show || k === kSel ? "visible" : "hidden" }}>{p.year}</span>;
          })}
        </div>
        <div />
        <div style={{ marginTop: "clamp(20px, 3vw, 28px)", display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--ink-muted)" }}>Change vs year before</span>
          <div style={{ position: "relative", height: tot + 40 }} aria-hidden="true">
            <div style={{ position: "absolute", left: 0, right: 0, top: upH + 20, borderTop: "1px solid #B5B0A8" }} />
            {yoy.map((x, k) => {
              if (x == null) return null;
              const h = Math.max(3, (Math.abs(x) / mx) * Math.max(upH, downH)), on = k === kSel, up = x >= 0;
              return (
                <span key={k} style={{ position: "absolute", top: 0, bottom: 0, left: P(cx(k) - 500 / nP), width: P(1000 / nP), display: "flex", justifyContent: "center", borderRadius: 10, transition: "background-color .2s", background: on ? "rgba(10,10,10,.06)" : "transparent" }}>
                  <span style={{ position: "absolute", width: "72%", maxWidth: 88, left: "50%", transform: "translateX(-50%)", height: h, ...(up ? { bottom: downH + 20, borderRadius: "8px 8px 2px 2px" } : { top: upH + 21, borderRadius: "2px 2px 8px 8px" }), background: up ? (on ? "#0A0A0A" : "#3D3B38") : "#C42F33", transition: "background-color .2s" }} />
                  <span style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: "clamp(10px, 1.6vw, 13px)", fontWeight: on ? 700 : 500, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", color: up ? "#0A0A0A" : "#C42F33", ...(up ? { bottom: downH + 24 + h } : { top: upH + 25 + h }) }}>{pct(x)}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <div className="lg-in" style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", fontSize: 12, color: "var(--ink-muted)", paddingLeft: 54 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 18, height: 3, background: "var(--ink)" }} />Index level ({pts[0].year} = 100)</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--ink-body)" }} />Growth</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--red)" }} />Decline</span>
        <span>Tap or hover a year for details.</span>
      </div>
    </figure>
  );
}

function Compare({ indexes, hover, setHover }: { indexes: ExplorerIndex[]; hover: number | null; setHover: (k: number | null) => void }) {
  const years = Array.from(new Set(indexes.flatMap((i) => i.series.map((p) => p.year)))).sort((a, b) => a - b);
  const n = years.length;
  if (n < 2) return null;
  const at = (i: ExplorerIndex, y: number) => i.series.find((p) => p.year === y)?.level ?? null;
  const all = indexes.flatMap((i) => i.series.map((p) => p.level));
  const lo = Math.min(100, Math.floor(Math.min(...all) / 50) * 50), hi = Math.max(lo + 50, Math.ceil(Math.max(...all) / 50) * 50);
  const ky = hover != null && hover < n ? hover : n - 1;
  const cy = (v: number) => ((hi - v) / (hi - lo)) * 1000, cx = (k: number) => (k / (n - 1)) * 1000;
  const lines = indexes.map((i, idx) => {
    const st = COMPARE_STYLES[idx % COMPARE_STYLES.length];
    const last = i.series.at(-1)?.level ?? 100;
    return { i, color: st[0], dash: st[1] || "none", dashSmall: st[1] ? st[1].split(" ").map((d) => Math.max(1, Math.round(+d / 2))).join(" ") : "none", w: st[2], last,
      points: years.map((y, k) => { const v = at(i, y); return v == null ? null : cx(k).toFixed(1) + "," + cy(v).toFixed(1); }).filter(Boolean).join(" ") };
  });
  const ends = lines.map((l) => ({ slug: l.i.slug, y: cy(l.last) })).sort((a, b) => a.y - b.y);
  for (let q = 1; q < ends.length; q++) if (ends[q].y - ends[q - 1].y < 80) ends[q].y = ends[q - 1].y + 80;
  const endY = Object.fromEntries(ends.map((e) => [e.slug, e.y]));
  const growth = indexes.map((i) => ({ i, g: i.series.length ? (i.series.at(-1)!.level / i.series[0].level - 1) * 100 : 0 })).sort((a, b) => b.g - a.g);
  const ticks: number[] = []; for (let t = lo; t <= hi; t += 50) ticks.push(t);
  const H = "clamp(240px, 36vw, 380px)";
  const read = lines.map((l) => ({ l, v: at(l.i, years[ky]) })).filter((x) => x.v != null).sort((a, b) => b.v! - a.v!);

  return (
    <figure style={{ margin: 0, background: "var(--sand)", padding: "clamp(18px, 3vw, 40px)", display: "flex", flexDirection: "column", gap: "clamp(16px, 2.4vw, 24px)" }}>
      <figcaption style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontFamily: GD, fontSize: "clamp(20px, 2.6vw, 28px)", fontWeight: 500, lineHeight: 1.2, letterSpacing: "-.015em" }}>{`${short(growth[0].i.name)} grew fastest (${pct(growth[0].g).replace(".0%", "%")}); ${short(growth.at(-1)!.i.name)} slowest (${pct(growth.at(-1)!.g).replace(".0%", "%")})`}</span>
        <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Index level, {years[0]} = 100. The higher the line, the faster that group’s wealth grew.</span>
      </figcaption>
      <div role="status" aria-live="polite" style={{ background: "var(--paper)", padding: "12px 16px", display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px 22px", fontSize: 14 }}>
        <span style={{ fontFamily: GD, fontSize: 22, fontWeight: 500 }}>{years[ky]}</span>
        {read.map(({ l, v }) => <span key={l.i.slug} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ display: "inline-block", width: 18, height: 0, borderTop: `3px ${l.dash !== "none" ? "dashed" : "solid"} ${l.color}` }} />{short(l.i.name)} <b style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{v!.toFixed(0)}</b></span>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr) clamp(92px, 16vw, 150px)", columnGap: 10 }}>
        <div style={{ position: "relative", height: H }} aria-hidden="true">{ticks.map((v) => <span key={v} style={{ position: "absolute", right: 0, top: P(cy(v)), transform: "translateY(-50%)", fontSize: 12, color: v === 100 ? "#0A0A0A" : "#5E5A54", fontWeight: v === 100 ? 600 : 400 }}>{v}</span>)}</div>
        <div style={{ position: "relative", height: H }} onMouseLeave={() => setHover(null)}>
          {ticks.map((v) => <div key={v} style={{ position: "absolute", left: 0, right: 0, top: P(cy(v)), borderTop: v === 100 ? "1px dashed #8C877F" : "1px solid #E3DCCF" }} />)}
          <svg className="rv" viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} role="img" aria-label={`All indexes compared, ${years[0]} = 100`}>
            {lines.map((l) => <polyline key={l.i.slug} points={l.points} fill="none" stroke={l.color} strokeWidth={l.w} strokeDasharray={l.dash} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />)}
          </svg>
          <div style={{ position: "absolute", top: 0, bottom: 0, width: 0, borderLeft: "1px solid rgba(10,10,10,.35)", pointerEvents: "none", left: P(cx(ky)) }} />
          {years.map((y, k) => { const w = 1000 / n, l = Math.max(0, cx(k) - w / 2), r = Math.min(1000, cx(k) + w / 2); return <button key={y} type="button" aria-label={String(y)} onMouseEnter={() => setHover(k)} onFocus={() => setHover(k)} onClick={() => setHover(k)} style={{ position: "absolute", top: 0, bottom: 0, left: P(l), width: P(r - l), background: "transparent", border: 0, padding: 0, cursor: "crosshair" }} />; })}
        </div>
        <div style={{ position: "relative", height: H }}>
          {lines.map((l) => <span key={l.i.slug} style={{ position: "absolute", left: 0, top: P(endY[l.i.slug]), transform: "translateY(-50%)", fontSize: 12, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", color: l.color === "#8C877F" ? "#5E5A54" : l.color }}><b style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{l.last.toFixed(0)}</b> {short(l.i.name).replace(/^Family Business$/, "Family").replace(/^Global Wealth$/, "Global")}</span>)}
        </div>
        <div />
        <div style={{ position: "relative", height: 22, marginTop: 8 }} aria-hidden="true">
          {years.map((y, k) => <span key={y} style={{ position: "absolute", top: 0, left: P(cx(k)), transform: `translateX(${k === 0 ? "0" : k === n - 1 ? "-100%" : "-50%"})`, fontSize: 12, color: k === ky ? "#0A0A0A" : "#5E5A54", fontWeight: k === ky ? 600 : 400, visibility: k % 3 === 0 || k === n - 1 || k === ky ? "visible" : "hidden" }}>{y}</span>)}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", fontSize: 13 }}>
        {lines.map((l) => <span key={l.i.slug} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><svg width="26" height="8" aria-hidden="true"><line x1="1" y1="4" x2="25" y2="4" stroke={l.color} strokeWidth="3" strokeDasharray={l.dashSmall} strokeLinecap="round" /></svg>{short(l.i.name)}</span>)}
      </div>
    </figure>
  );
}
