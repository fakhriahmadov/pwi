import type { PublicIndex } from "@/lib/research";
import type { Point } from "@/lib/indexes";
import { fmtLevel } from "@/lib/research";

/* Shared index visuals (Home and Insights). Styles and animations: app/insights/insights.css (.pi-ins). */

const TICKER_DOTS = ["#FFFFFF", "#E5484A", "#8C877F", "#5E5A54", "#B5B0A8", "#D9D4CC"];

/** The featured index drawn as a red line behind a dark hero, with the left side faded for the text. */
export function HeroIndexLine({ series }: { series: Point[] }) {
  if (series.length < 2) return null;
  const lo = 90, hi = Math.max(...series.map((p) => p.level)) * 1.05;
  const pts = series.map((p, k) => [(k / (series.length - 1)) * 1000, 400 - ((p.level - lo) / (hi - lo)) * 380].map((n) => n.toFixed(1)).join(","));
  return (
    <>
      <svg viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", right: 0, bottom: 0, width: "min(100%, 980px)", height: "72%", pointerEvents: "none" }}>
        <defs><linearGradient id="hero-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E5484A" stopOpacity=".22" /><stop offset="1" stopColor="#E5484A" stopOpacity="0" /></linearGradient></defs>
        <path d={"M" + pts.join(" L") + " L1000,400 L0,400 Z"} fill="url(#hero-g)" className="fade-a" />
        <polyline points={pts.join(" ")} pathLength={1} className="hero-line" fill="none" stroke="#E5484A" strokeWidth="2" strokeOpacity=".8" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(10,10,10,.96) 0%, rgba(10,10,10,.75) 45%, rgba(10,10,10,.15) 100%)", pointerEvents: "none" }} aria-hidden="true" />
    </>
  );
}

/** A slow, endless strip of index levels and yearly changes (pauses on hover). */
export function IndexTicker({ indexes }: { indexes: PublicIndex[] }) {
  if (!indexes.length) return null;
  const loop = [...indexes, ...indexes];
  return (
    <div className="ticker-wrap" style={{ position: "relative", borderTop: "1px solid var(--ink-line)", overflow: "hidden", background: "rgba(255,255,255,.03)" }} aria-label="Latest index levels">
      <div className="ticker">
        {loop.map((i, n) => {
          const ch = i.result.changePct, up = ch == null || ch >= 0;
          return (
            <span key={n} aria-hidden={n >= indexes.length} style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 28px", borderRight: "1px solid var(--ink-line)", whiteSpace: "nowrap", fontSize: 14 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: TICKER_DOTS[(n % indexes.length) % TICKER_DOTS.length] }} />
              <span style={{ fontWeight: 500 }}>{i.name.replace(/ Index$/, "")}</span>
              <span style={{ fontFamily: "var(--font-display)", fontVariantNumeric: "tabular-nums" }}>{fmtLevel(i.result.latest?.level)}</span>
              {ch != null && <span style={{ fontWeight: 600, color: up ? "#FFFFFF" : "#E5484A" }}>{up ? "▲" : "▼"} {Math.abs(ch).toFixed(1)}%</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Compact line chart of one index on a dark background (Home index band). Labels are HTML so they stay crisp. */
export function IndexBandChart({ index }: { index: PublicIndex }) {
  const s = index.result.series;
  if (s.length < 2) return null;
  const n = s.length, vals = s.map((p) => p.level);
  const step = Math.max(...vals) - Math.min(...vals, 100) > 120 ? 50 : 25;
  const lo = Math.floor(Math.min(...vals, 100) / step) * step, hi = Math.ceil(Math.max(...vals) / step) * step;
  const x = (k: number) => (k / (n - 1)) * 1000, y = (v: number) => ((hi - v) / (hi - lo)) * 1000;
  const P = (v: number) => (v / 10).toFixed(2) + "%";
  const line = s.map((p, k) => x(k).toFixed(1) + "," + y(p.level).toFixed(1)).join(" ");
  const ticks: number[] = []; for (let t = lo; t <= hi; t += step) ticks.push(t);
  const last = s[n - 1];
  const labelYears = s.filter((_, k) => k === 0 || k === n - 1 || (n - 1 - k) % 3 === 0);
  return (
    <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
      <figcaption style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--stone)" }}><b style={{ color: "var(--paper)", fontWeight: 500 }}>{index.name}</b> · {s[0].year} = 100</span>
        <span style={{ fontSize: 13, color: "var(--stone-2)" }}>{s[0].year}–{last.year}</span>
      </figcaption>
      <div style={{ display: "grid", gridTemplateColumns: "34px minmax(0,1fr)", columnGap: 10 }}>
        <div style={{ position: "relative", height: "clamp(180px, 20vw, 240px)" }} aria-hidden="true">
          {ticks.map((t) => <span key={t} style={{ position: "absolute", right: 0, top: P(y(t)), transform: "translateY(-50%)", fontSize: 11, color: t === 100 ? "var(--paper)" : "var(--stone-2)", fontVariantNumeric: "tabular-nums" }}>{t}</span>)}
        </div>
        <div style={{ position: "relative", height: "clamp(180px, 20vw, 240px)" }}>
          {ticks.map((t) => <div key={t} style={{ position: "absolute", left: 0, right: 0, top: P(y(t)), borderTop: t === 100 ? "1px dashed var(--stone-2)" : "1px solid var(--ink-line)" }} />)}
          <svg className="rv" viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} role="img" aria-label={`${index.name}: ${fmtLevel(s[0].level)} in ${s[0].year} to ${fmtLevel(last.level)} in ${last.year}`}>
            <defs><linearGradient id="band-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E5484A" stopOpacity=".28" /><stop offset="1" stopColor="#E5484A" stopOpacity="0" /></linearGradient></defs>
            <path d={"M" + line.split(" ").join(" L") + " L1000,1000 L0,1000 Z"} fill="url(#band-g)" />
            <polyline points={line} fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          <span style={{ position: "absolute", left: P(x(n - 1)), top: P(y(last.level)), width: 12, height: 12, margin: "-6px 0 0 -6px", borderRadius: "50%", background: "#E5484A", boxShadow: "0 0 0 3px var(--ink)" }} />
          <span style={{ position: "absolute", right: 0, top: P(y(last.level)), transform: "translate(0, -180%)", background: "var(--paper)", color: "var(--ink)", fontSize: 12, fontWeight: 600, padding: "3px 8px", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{last.year}: {fmtLevel(last.level)}</span>
        </div>
        <div />
        <div style={{ position: "relative", height: 20, marginTop: 8 }} aria-hidden="true">
          {labelYears.map((p) => { const k = s.indexOf(p); return <span key={p.year} style={{ position: "absolute", left: P(x(k)), transform: `translateX(${k === 0 ? "0" : k === n - 1 ? "-100%" : "-50%"})`, fontSize: 11, color: "var(--stone-2)" }}>{p.year}</span>; })}
        </div>
      </div>
    </figure>
  );
}
