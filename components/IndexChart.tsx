import type { Point } from "@/lib/indexes";

/** Line chart of index level (base year = 100). `spark` draws a compact version without labels. */
export function IndexChart({ series, color, spark = false, label }: { series: Point[]; color: string; spark?: boolean; label: string }) {
  if (series.length < 2) return spark ? null : <p className="muted" style={{ fontSize: 14 }}>The chart appears once there are at least two years of data.</p>;
  const W = spark ? 240 : 1000, H = spark ? 64 : 320, PX = spark ? 2 : 48, PY = spark ? 6 : 28;
  const vals = series.map((p) => p.level);
  const min = Math.min(...vals, 100), max = Math.max(...vals, 100);
  const pad = (max - min) * 0.08 || 5;
  const lo = min - pad, hi = max + pad;
  const x = (i: number) => PX + (i / (series.length - 1)) * (W - PX * 2);
  const y = (v: number) => H - PY - ((v - lo) / (hi - lo)) * (H - PY * 2);
  const d = series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.level).toFixed(1)}`).join(" ");
  const last = series[series.length - 1];
  const ticks = [lo + (hi - lo) * 0.1, 100, lo + (hi - lo) * 0.9].filter((t, i, a) => a.findIndex((u) => Math.abs(u - t) < (hi - lo) * 0.12) === i);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label={`${label}: ${series[0].year} ${series[0].level.toFixed(1)} to ${last.year} ${last.level.toFixed(1)}`}>
      {!spark && ticks.map((t) => (
        <g key={t}>
          <line x1={PX} x2={W - PX} y1={y(t)} y2={y(t)} stroke={t === 100 ? "#8C877F" : "#E3DCCF"} strokeDasharray={t === 100 ? "4 4" : undefined} />
          <text x={PX - 8} y={y(t) + 4} fontSize="12" textAnchor="end" fill="#5E5A54">{Math.round(t)}</text>
        </g>
      ))}
      <path d={`${d} L${x(series.length - 1)},${H - PY} L${x(0)},${H - PY} Z`} fill={color} fillOpacity={spark ? 0.1 : 0.08} />
      <path d={d} fill="none" stroke={color} strokeWidth={spark ? 2 : 3} strokeLinejoin="round" />
      <circle cx={x(series.length - 1)} cy={y(last.level)} r={spark ? 3 : 6} fill={color} />
      {!spark && series.map((p, i) => (i === 0 || i === series.length - 1 || series.length <= 8) && (
        <text key={p.year} x={x(i)} y={H - 6} fontSize="12" textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"} fill="#5E5A54">{p.year}</text>
      ))}
    </svg>
  );
}
