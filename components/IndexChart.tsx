import type { Point } from "@/lib/indexes";

/** Line chart of index level (base year = 100). `spark` draws a compact version without labels. */
export function IndexChart({ series, color, spark = false, label }: { series: Point[]; color: string; spark?: boolean; label: string }) {
  if (series.length < 2) return spark ? null : <p className="muted" style={{ fontSize: 14 }}>The chart appears once there are at least two years of data.</p>;
  const W = spark ? 240 : 1000, H = spark ? 64 : 320, PX = spark ? 2 : 8, PY = spark ? 6 : 20;
  const vals = series.map((p) => p.level);
  const min = Math.min(...vals, 100), max = Math.max(...vals, 100);
  const pad = (max - min) * 0.08 || 5;
  const lo = min - pad, hi = max + pad;
  const x = (i: number) => PX + (i / (series.length - 1)) * (W - PX * 2);
  const y = (v: number) => H - PY - ((v - lo) / (hi - lo)) * (H - PY * 2);
  const d = series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.level).toFixed(1)}`).join(" ");
  const last = series[series.length - 1];
  const ticks = [lo + (hi - lo) * 0.1, 100, lo + (hi - lo) * 0.9].filter((t, i, a) => a.findIndex((u) => Math.abs(u - t) < (hi - lo) * 0.12) === i);
  const svg = (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio={spark ? undefined : "none"} style={spark ? { width: "100%", height: "auto", display: "block" } : { position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} role="img" aria-label={`${label}: ${series[0].year} ${series[0].level.toFixed(1)} to ${last.year} ${last.level.toFixed(1)}`}>
      {!spark && ticks.map((t) => <line key={t} x1={PX} x2={W - PX} y1={y(t)} y2={y(t)} stroke={t === 100 ? "#8C877F" : "#E3DCCF"} strokeDasharray={t === 100 ? "4 4" : undefined} vectorEffect="non-scaling-stroke" />)}
      <path d={`${d} L${x(series.length - 1)},${H - PY} L${x(0)},${H - PY} Z`} fill={color} fillOpacity={spark ? 0.1 : 0.08} />
      <path d={d} fill="none" stroke={color} strokeWidth={spark ? 2 : 3} strokeLinejoin="round" vectorEffect={spark ? undefined : "non-scaling-stroke"} />
      {spark && <circle cx={x(series.length - 1)} cy={y(last.level)} r={3} fill={color} />}
    </svg>
  );
  if (spark) return svg;
  // Labels are HTML (not SVG text) so they stay readable at any width.
  const pc = (v: number, of: number) => `${(v / of) * 100}%`;
  const shown = series.filter((_, i) => i === 0 || i === series.length - 1 || series.length <= 8 || i % 2 === 0);
  return (
    <div className="chart">
      <div className="chart-plot">
        {svg}
        <span className="chart-dot" style={{ left: pc(x(series.length - 1), W), top: pc(y(last.level), H), background: color }} />
        {ticks.map((t) => <span key={t} className="chart-y" style={{ top: pc(y(t), H) }}>{Math.round(t)}</span>)}
      </div>
      <div className="chart-x">{shown.map((p) => <span key={p.year} style={{ left: pc(x(series.indexOf(p)), W) }}>{p.year}</span>)}</div>
    </div>
  );
}

/** Several indexes on one chart (each relative to its own base year = 100). Labels are listed in a legend beside it. */
export function CompareChart({ lines }: { lines: { name: string; color: string; series: Point[] }[] }) {
  const all = lines.flatMap((l) => l.series);
  if (all.length < 2) return null;
  const years = Array.from(new Set(all.map((p) => p.year))).sort((a, b) => a - b);
  const W = 1000, H = 320, PX = 8, PY = 20;
  const vals = all.map((p) => p.level);
  const min = Math.min(...vals, 100), max = Math.max(...vals, 100), pad = (max - min) * 0.08 || 5;
  const lo = min - pad, hi = max + pad;
  const x = (yr: number) => PX + ((years.indexOf(yr)) / Math.max(1, years.length - 1)) * (W - PX * 2);
  const y = (v: number) => H - PY - ((v - lo) / (hi - lo)) * (H - PY * 2);
  const pc = (v: number, of: number) => `${(v / of) * 100}%`;
  return (
    <div className="chart">
      <div className="chart-plot">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} role="img" aria-label={`Index levels compared: ${lines.map((l) => `${l.name} ${l.series.at(-1)?.level.toFixed(0)}`).join(", ")}`}>
          <line x1={PX} x2={W - PX} y1={y(100)} y2={y(100)} stroke="#8C877F" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          {lines.map((l) => (
            <path key={l.name} d={l.series.map((p, i) => `${i ? "L" : "M"}${x(p.year).toFixed(1)},${y(p.level).toFixed(1)}`).join(" ")} fill="none" stroke={l.color} strokeWidth={l.color === "#0A0A0A" ? 3.5 : 2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        <span className="chart-y" style={{ top: pc(y(100), H) }}>100</span>
        <span className="chart-y" style={{ top: pc(y(max), H) }}>{Math.round(max)}</span>
      </div>
      <div className="chart-x"><span style={{ left: 0 }}>{years[0]}</span><span style={{ left: "100%" }}>{years.at(-1)}</span></div>
    </div>
  );
}
