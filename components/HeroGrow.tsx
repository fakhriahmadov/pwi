/**
 * Home hero, desktop: a project and its investors.
 * 1. Investors search on their own (pulsing rings) — co-investors are hard to find.
 * 2. The Institute (the "P." mark) appears and connects them: to each other and to the project.
 * 3. Capital (red) flows from each investor through the network into the project; the project grows.
 * 4. A growth line rises. Then the loop restarts.
 *
 * Performance: everything moves with CSS animations of `transform` and `opacity` only (no SMIL, no animated
 * geometry), so the browser does not restyle or re-lay-out the page on every frame. The shapes are drawn in their
 * final state; with reduced motion the animations are switched off and that final state is what people see.
 * The animation pauses while it is off screen (HeroGrowPause). Hidden below 1200px.
 */
import { HeroGrowPause } from "./HeroGrowPause";

const T = 10;
const GROUND = 392;

const INV = [{ x: 250, y: 122 }, { x: 314, y: 200 }, { x: 300, y: 300 }];
const HUB = { x: 160, y: 196 };
const CARD = { x: 40, y: 280, w: 144, h: 112 }; // the project, standing on the ground line
const HAND = { x: CARD.x + CARD.w / 2, y: CARD.y }; // where capital enters the project

const SEARCH_END = 2.6, HUB_IN = 2.7, LINKS0 = 3.0, LINKS1 = 3.9;
const PULSE = (k: number) => 4.0 + 0.8 * k, FLIGHT = 1.0;
const SEQ = [0, 1, 2, 0]; // which investor sends each pulse
const BARS = [20, 34, 50, 68];
const BAR_X = (k: number) => CARD.x + 22 + k * 28;
const BAR_W = 16;
const G0 = PULSE(3) + FLIGHT + 0.2, G1 = G0 + 0.8;
const F0 = 9.2, F1 = 9.7;
const GROWTH_START = { x: BAR_X(3) + BAR_W / 2, y: GROUND - 10 - BARS[3] - 8 };
const GROWTH = `M${GROWTH_START.x},${GROWTH_START.y} L172,${CARD.y - 6} L184,${CARD.y + 2} L200,${CARD.y - 28}`;
const GROWTH_END = { x: 200, y: CARD.y - 28 };

const W = "#FFFFFF", MUTE = "#B5B0A8", DIM = "#5E5A54", RED = "#E5484A";

type Pt = { x: number; y: number };
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const at = (p: Pt, q: Pt, gap: number) => { const d = dist(p, q); return { x: p.x + ((q.x - p.x) * gap) / d, y: p.y + ((q.y - p.y) * gap) / d }; };
const seg = (p: Pt, q: Pt, gp = 16, gq = 16) => { const a = at(p, q, gp), b = at(q, p, gq); return `M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)}`; };

/* ---------- layers: each moving part is its own small HTML box, so the browser can animate it on the GPU ---------- */
type Box = { x: number; y: number; w: number; h: number };
const VB: Box = { x: 0, y: 70, w: 340, h: 370 };
const pctX = (x: number, b: Box) => `${(((x - b.x) / b.w) * 100).toFixed(2)}%`;
const pctY = (y: number, b: Box) => `${(((y - b.y) / b.h) * 100).toFixed(2)}%`;
const GROWTH_BOX: Box = { x: GROWTH_START.x - 6, y: GROWTH_END.y - 8, w: GROWTH_END.x - GROWTH_START.x + 14, h: GROWTH_START.y - GROWTH_END.y + 14 };
/** An absolutely positioned box over the drawing, holding an SVG of just that area (same coordinates as the drawing). */
function Layer({ box, className, style, children }: { box: Box; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div className={`hg-layer ${className ?? ""}`} style={{ left: pctX(box.x, VB), top: pctY(box.y, VB), width: `${(box.w / VB.w) * 100}%`, height: `${(box.h / VB.h) * 100}%`, ...style }}>
      <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} width="100%" height="100%" overflow="visible">{children}</svg>
    </div>
  );
}
const around = (p: Pt, r: number): Box => ({ x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r });
const span = (pts: Pt[], pad = 3): Box => { const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y); const x = Math.min(...xs) - pad, y = Math.min(...ys) - pad; return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y }; };

/* ---------- keyframes, generated once ---------- */
const pc = (t: number) => `${Math.min(100, Math.max(0, (t / T) * 100)).toFixed(2)}%`;
const css: string[] = [];
let n = 0;
/** One looping animation: stops are [seconds, declarations]. Returns the class name to put on the element. */
function anim(stops: [number, string][], opts = "") {
  const name = `hg${n++}`;
  css.push(`@keyframes ${name}{${stops.map(([t, d]) => `${pc(t)}{${d}}`).join("")}}.hg-on .${name}{animation:${name} ${T}s linear infinite;${opts}}`);
  return name;
}
const fadeIn = (from: number, to: number) => anim([[0, "opacity:0"], [from, "opacity:0"], [to, "opacity:1"], [F0, "opacity:1"], [F1, "opacity:0"], [T, "opacity:0"]]);

const searchWin = anim([[0, "opacity:1"], [SEARCH_END - 0.05, "opacity:1"], [SEARCH_END, "opacity:0"], [T, "opacity:0"]]);
const question = INV.map((_, k) => anim([[0, "opacity:0"], [0.3 + k * 0.3, "opacity:0"], [0.6 + k * 0.3, "opacity:1"], [SEARCH_END - 0.1, "opacity:1"], [SEARCH_END, "opacity:0"], [T, "opacity:0"]]));
css.push(`@keyframes hgRing{from{transform:scale(1);opacity:.7}to{transform:scale(2.8);opacity:0}}.hg-on .hgRing{animation:hgRing 1.2s linear infinite;transform-origin:50% 50%}`);
const coFade = fadeIn(LINKS0 + 0.3, LINKS1);
const hubFade = fadeIn(LINKS0, LINKS1 - 0.3);
const entFade = fadeIn(LINKS0 + 0.3, LINKS1);
const hub = anim([[0, "opacity:0;transform:scale(.6)"], [HUB_IN, "opacity:0;transform:scale(.6)"], [HUB_IN + 0.35, "opacity:1;transform:scale(1)"], [F0, "opacity:1;transform:scale(1)"], [F1, "opacity:0;transform:scale(1)"], [T, "opacity:0;transform:scale(.6)"]], "transform-origin:50% 50%");
const bars = BARS.map((_, k) => { const a = PULSE(k) + FLIGHT; return anim([[0, "transform:scaleY(.001);opacity:1"], [a, "transform:scaleY(.001)"], [a + 0.4, "transform:scaleY(1)"], [F0, "transform:scaleY(1);opacity:1"], [F1, "opacity:0"], [T, "transform:scaleY(.001);opacity:0"]], "transform-origin:50% 100%"); });
const PULSE_START = SEQ.map((i) => ({ x: INV[i].x, y: INV[i].y + 10 }));
const pulses = SEQ.map((i, k) => {
  const pts = [{ x: INV[i].x, y: INV[i].y + 10 }, HUB, HAND, { x: BAR_X(k) + BAR_W / 2, y: GROUND - 10 - BARS[k] }];
  const lens = pts.slice(1).map((p, j) => dist(pts[j], p)), total = lens.reduce((a, b) => a + b, 0);
  const s = PULSE(k), a = s + FLIGHT;
  let acc = 0;
  const legs = pts.map((p, j) => { if (j > 0) acc += lens[j - 1]; return [s + (FLIGHT * acc) / total, `transform:translate(${(((p.x - pts[0].x) / 10) * 100).toFixed(1)}%,${(((p.y - pts[0].y) / 10) * 100).toFixed(1)}%)`] as [number, string]; });
  const start = legs[0][1], end = legs[legs.length - 1][1];
  return anim([[0, `${start};opacity:0`], [s - 0.01, `${start};opacity:0`], [s, "opacity:1"], ...legs.slice(1, -1), [a - 0.05, "opacity:1"], [a, `${end};opacity:0`], [T, `${end};opacity:0`]]);
});
const growth = anim([[0, "opacity:0;transform:scale(.15)"], [G0 - 0.01, "opacity:0;transform:scale(.15)"], [G0, "opacity:1"], [G1, "transform:scale(1)"], [F0, "opacity:1;transform:scale(1)"], [F1, "opacity:0"], [T, "opacity:0;transform:scale(.15)"]],
  `transform-origin:${pctX(GROWTH_START.x, GROWTH_BOX)} ${pctY(GROWTH_START.y, GROWTH_BOX)}`);
const growthDot = anim([[0, "opacity:0"], [G1 - 0.05, "opacity:0"], [G1, "opacity:1"], [F0, "opacity:1"], [F1, "opacity:0"], [T, "opacity:0"]]);
const STYLE = css.join("");

function Person({ x, y, r = 8 }: { x: number; y: number; r?: number }) {
  return (
    <g fill="none" stroke={W} strokeWidth="1.6" strokeLinecap="round">
      <circle cx={x} cy={y} r={r} />
      <path d={`M${x - r * 1.9},${y + r * 3.4} Q${x - r * 1.9},${y + r * 1.4} ${x},${y + r * 1.4} Q${x + r * 1.9},${y + r * 1.4} ${x + r * 1.9},${y + r * 3.4}`} />
    </g>
  );
}

export function HeroGrow() {
  const co = [[0, 1], [1, 2], [0, 2]];
  const label = { fontFamily: "var(--font-body), Poppins, sans-serif", fontSize: 12, fontWeight: 500, fill: MUTE } as const;
  return (
    <div className="hero-grow hg-on" aria-hidden="true">
      <style>{STYLE}</style>
      <HeroGrowPause />
      {/* everything that does not move */}
      <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} width="100%" style={{ display: "block" }}>
        <defs>
          <radialGradient id="hgFade" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#0A0A0A" stopOpacity="1" /><stop offset=".65" stopColor="#0A0A0A" stopOpacity=".92" /><stop offset="1" stopColor="#0A0A0A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={180} cy={260} rx={240} ry={210} fill="url(#hgFade)" />
        <path d={`M0,${GROUND} H200`} stroke="var(--ink-line)" strokeWidth="1.2" />
        {INV.map((p, k) => <Person key={`i${k}`} x={p.x} y={p.y} r={7} />)}
        <g fill="none" strokeLinecap="round">
          <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} fill="rgba(255,255,255,.03)" stroke={W} strokeWidth="1.6" />
          <path d={`M${CARD.x},${CARD.y + 20} H${CARD.x + CARD.w}`} stroke={DIM} strokeWidth="1.2" />
          {[0, 1, 2].map((d) => <circle key={d} cx={CARD.x + 11 + d * 8} cy={CARD.y + 10} r={2} fill={MUTE} />)}
          <path d={`M${CARD.x + 44},${CARD.y + 10} H${CARD.x + 96}`} stroke={MUTE} strokeWidth="1.6" />
          <path d={`M${CARD.x + 14},${GROUND - 10} H${CARD.x + CARD.w - 14}`} stroke={DIM} strokeWidth="1" />
        </g>
        <g fontFamily="var(--font-body), Poppins, sans-serif" fontSize="9.5" fontWeight="500" letterSpacing="2.6" fill={MUTE}>
          <text x={CARD.x} y={GROUND + 26}>PROJECT</text>
          <text x={318} y={102} textAnchor="end">INVESTORS</text>
        </g>
      </svg>

      {/* 1. investors searching alone (motion only: hidden when motion is reduced) */}
      <div className={`hg-layer hg-full hg-motion ${searchWin}`}>
        {INV.map((p, k) => [0, 0.6].map((off) => (
          <Layer key={`r${k}${off}`} box={around({ x: p.x, y: p.y + 10 }, 13)} className="hgRing" style={{ animationDelay: `${off + k * 0.2}s` }}>
            <circle cx={p.x} cy={p.y + 10} r={12} fill="none" stroke={MUTE} strokeWidth="1" />
          </Layer>
        )))}
        {INV.map((p, k) => <Layer key={`q${k}`} box={{ x: p.x + 11, y: p.y - 18, w: 12, h: 16 }} className={question[k]}><text x={p.x + 13} y={p.y - 6} {...label}>?</text></Layer>)}
      </div>

      {/* 2. the Institute connects them */}
      <Layer box={span(INV)} className={coFade}>{co.map(([a, b]) => <path key={`${a}${b}`} d={seg(INV[a], INV[b])} fill="none" stroke={MUTE} strokeWidth="1" strokeDasharray="2 5" strokeLinecap="round" />)}</Layer>
      <Layer box={span([...INV, HUB])} className={hubFade}>{INV.map((p, k) => <path key={k} d={seg(p, HUB, 16, 20)} fill="none" stroke={W} strokeWidth="1.3" strokeLinecap="round" />)}</Layer>
      <Layer box={span([HUB, HAND])} className={entFade}><path d={seg(HUB, HAND, 20, 2)} fill="none" stroke={W} strokeWidth="1.3" strokeLinecap="round" /></Layer>
      <Layer box={around(HUB, 21)} className={hub}>
        <circle cx={HUB.x} cy={HUB.y} r={19} fill="#0A0A0A" stroke={W} strokeWidth="1.6" />
        <text x={HUB.x - 1} y={HUB.y + 7} textAnchor="middle" fontFamily="var(--font-display), 'Space Grotesk', sans-serif" fontWeight="600" fontSize="20" fill={W}>P<tspan fill={RED}>.</tspan></text>
      </Layer>

      {/* 3. capital flows through the network; the project grows */}
      {BARS.map((h, k) => (
        <Layer key={`bar${k}`} box={{ x: BAR_X(k) - 1, y: GROUND - 10 - h - 1, w: BAR_W + 2, h: h + 2 }} className={bars[k]}>
          <rect x={BAR_X(k)} width={BAR_W} y={GROUND - 10 - h} height={h} fill={k === 3 ? W : "none"} stroke={W} strokeWidth="1.4" />
        </Layer>
      ))}
      <div className="hg-layer hg-full hg-motion">
        {pulses.map((c, k) => <Layer key={`p${k}`} box={around(PULSE_START[k], 5)} className={c} style={{ opacity: 0 }}><circle cx={PULSE_START[k].x} cy={PULSE_START[k].y} r={4.5} fill={RED} /></Layer>)}
      </div>

      {/* 4. growth */}
      <Layer box={GROWTH_BOX} className={growth}><path d={GROWTH} fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Layer>
      <Layer box={around(GROWTH_END, 6)} className={growthDot}><circle cx={GROWTH_END.x} cy={GROWTH_END.y} r={5.5} fill={RED} /></Layer>
    </div>
  );
}
