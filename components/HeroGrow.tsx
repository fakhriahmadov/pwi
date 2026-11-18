/**
 * Home hero, desktop: entrepreneur and investors.
 * 1. Investors search on their own (pulsing rings) — co-investors are hard to find.
 * 2. The Institute (the "P." mark) appears and connects them: to each other and to the entrepreneur.
 * 3. Capital (red) flows from each investor through the network to the entrepreneur; the venture grows.
 * 4. A growth line rises. Then the loop restarts.
 * Pure SVG (SMIL), one 10-second loop, no JavaScript. Hidden below 1200px; still image for reduced motion.
 */
const T = 10;
const GROUND = 392;
const kt = (...t: number[]) => t.map((x) => Math.min(1, Math.max(0, x / T)).toFixed(4)).join(";");

const INV = [{ x: 250, y: 122 }, { x: 314, y: 200 }, { x: 270, y: 282 }];
const HUB = { x: 160, y: 196 };
const ENT = { x: 52, y: 318 };
const HAND = { x: 90, y: 344 }; // where capital lands: the entrepreneur's laptop

const SEARCH_END = 2.6, HUB_IN = 2.7, LINKS0 = 3.0, LINKS1 = 3.9;
const PULSE = (k: number) => 4.0 + 0.8 * k, FLIGHT = 1.0;
const SEQ = [0, 1, 2, 0]; // which investor sends each pulse
const BARS = [24, 38, 54, 74];
const BAR_X = (k: number) => 104 + k * 17;
const G0 = PULSE(3) + FLIGHT + 0.2, G1 = G0 + 0.8;
const F0 = 9.2, F1 = 9.7;
const GROWTH = `M${BAR_X(3) + 8},${GROUND - BARS[3] - 8} L186,${GROUND - 104} L198,${GROUND - 97} L218,${GROUND - 136}`;
const GROWTH_END = { x: 218, y: GROUND - 136 };
const GL = 170;

const W = "#FFFFFF", MUTE = "#B5B0A8", DIM = "#5E5A54", RED = "#E5484A";

function Person({ x, y, r = 8 }: { x: number; y: number; r?: number }) {
  return (
    <g fill="none" stroke={W} strokeWidth="1.6" strokeLinecap="round">
      <circle cx={x} cy={y} r={r} />
      <path d={`M${x - r * 1.9},${y + r * 3.4} Q${x - r * 1.9},${y + r * 1.4} ${x},${y + r * 1.4} Q${x + r * 1.9},${y + r * 1.4} ${x + r * 1.9},${y + r * 3.4}`} />
    </g>
  );
}

/** A line that draws itself in (stroke-dashoffset) and fades out with the loop. */
function Link({ d, len, from, to, dashed, still }: { d: string; len: number; from: number; to: number; dashed?: boolean; still?: boolean }) {
  const dur = `${T}s`;
  return (
    <g opacity={still ? 1 : 0}>
      {!still && <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={kt(0, from - 0.01, from, F0, F1, T)} />}
      <path d={d} fill="none" stroke={dashed ? MUTE : W} strokeWidth={dashed ? 1 : 1.3} strokeDasharray={dashed ? "2 5" : `${len}`} strokeDashoffset={still || dashed ? 0 : len} strokeLinecap="round">
        {!still && !dashed && <animate attributeName="stroke-dashoffset" dur={dur} repeatCount="indefinite" values={`${len};${len};0;0`} keyTimes={kt(0, from, to, T)} />}
      </path>
    </g>
  );
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const at = (p: { x: number; y: number }, q: { x: number; y: number }, gap: number) => {
  // a point `gap` px from p towards q (so lines stop short of the figures)
  const d = dist(p, q); return { x: p.x + ((q.x - p.x) * gap) / d, y: p.y + ((q.y - p.y) * gap) / d };
};
const seg = (p: { x: number; y: number }, q: { x: number; y: number }, gp = 16, gq = 16) => {
  const a = at(p, q, gp), b = at(q, p, gq); return { d: `M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)}`, len: Math.round(dist(a, b)) };
};

function Scene({ still }: { still?: boolean }) {
  const dur = `${T}s`;
  const id = still ? "S" : "L";
  const hubLinks = INV.map((p) => seg(p, HUB, 16, 20));
  const coLinks = [seg(INV[0], INV[1]), seg(INV[1], INV[2]), seg(INV[0], INV[2])];
  const toEnt = seg(HUB, HAND, 20, 6);
  return (
    <>
      <defs>
        <radialGradient id={`hgFade${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#0A0A0A" stopOpacity="1" /><stop offset=".65" stopColor="#0A0A0A" stopOpacity=".92" /><stop offset="1" stopColor="#0A0A0A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={180} cy={260} rx={240} ry={210} fill={`url(#hgFade${id})`} />
      <path d={`M0,${GROUND} H200`} stroke="var(--ink-line)" strokeWidth="1.2" />

      {/* 1. investors searching alone */}
      {!still && INV.map((p, k) => (
        <g key={`r${k}`}>
          {[0, 0.6].map((off) => (
            <circle key={off} cx={p.x} cy={p.y + 10} r={10} fill="none" stroke={MUTE} strokeWidth="1">
              <animate attributeName="r" dur="1.2s" begin={`${off + k * 0.2}s`} repeatCount="indefinite" values="12;34" />
              <animate attributeName="opacity" dur="1.2s" begin={`${off + k * 0.2}s`} repeatCount="indefinite" values=".7;0" />
              <animate attributeName="visibility" dur={dur} repeatCount="indefinite" values="visible;hidden" keyTimes={kt(0, SEARCH_END)} calcMode="discrete" />
            </circle>
          ))}
          <text x={p.x + 13} y={p.y - 6} fontFamily="var(--font-body), Poppins, sans-serif" fontSize="12" fontWeight="500" fill={MUTE} opacity={0}>?
            <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={kt(0, 0.3 + k * 0.3, 0.6 + k * 0.3, SEARCH_END - 0.1, SEARCH_END, T)} />
          </text>
        </g>
      ))}

      {/* 2. the Institute connects them */}
      {coLinks.map((l, k) => <Link key={`co${k}`} d={l.d} len={l.len} from={LINKS0 + 0.3} to={LINKS1} dashed still={still} />)}
      {hubLinks.map((l, k) => <Link key={`h${k}`} d={l.d} len={l.len} from={LINKS0} to={LINKS1 - 0.3} still={still} />)}
      <Link d={toEnt.d} len={toEnt.len} from={LINKS0 + 0.3} to={LINKS1} still={still} />

      <g opacity={still ? 1 : 0}>
        {!still && <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={kt(0, HUB_IN, HUB_IN + 0.3, F0, F1, T)} />}
        <circle cx={HUB.x} cy={HUB.y} r={19} fill="#0A0A0A" stroke={W} strokeWidth="1.6" />
        <text x={HUB.x - 1} y={HUB.y + 7} textAnchor="middle" fontFamily="var(--font-display), 'Space Grotesk', sans-serif" fontWeight="600" fontSize="20" fill={W}>P<tspan fill={RED}>.</tspan></text>
      </g>

      {INV.map((p, k) => <Person key={`i${k}`} x={p.x} y={p.y} r={7} />)}

      {/* the entrepreneur, at work on a laptop */}
      <Person x={ENT.x} y={ENT.y} r={10} />
      <g fill="none" stroke={W} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {/* desk, and an open laptop seen from the side */}
        <path d={`M${ENT.x - 6},${GROUND - 24} H${ENT.x + 46}`} />
        <path d={`M${ENT.x + 40},${GROUND - 24} V${GROUND}`} stroke={DIM} />
        <path d={`M${ENT.x + 16},${GROUND - 27} H${ENT.x + 36} L${ENT.x + 42},${GROUND - 50}`} />
      </g>
      {!still && (
        <circle cx={ENT.x + 37} cy={GROUND - 40} r={1.6} fill={W}>
          <animate attributeName="opacity" dur="1s" repeatCount="indefinite" values="1;0;1" />
        </circle>
      )}

      {/* 3. capital flows through the network; the venture grows */}
      {BARS.map((h, k) => {
        const a = PULSE(k) + FLIGHT;
        return (
          <rect key={`bar${k}`} x={BAR_X(k)} width={10} y={still ? GROUND - h : GROUND} height={still ? h : 0} fill={k === 3 ? W : "none"} stroke={W} strokeWidth="1.4">
            {!still && <animate attributeName="height" dur={dur} repeatCount="indefinite" values={`0;0;${h};${h};0`} keyTimes={kt(0, a, a + 0.4, F1, T)} />}
            {!still && <animate attributeName="y" dur={dur} repeatCount="indefinite" values={`${GROUND};${GROUND};${GROUND - h};${GROUND - h};${GROUND}`} keyTimes={kt(0, a, a + 0.4, F1, T)} />}
          </rect>
        );
      })}
      {!still && SEQ.map((i, k) => {
        const p = INV[i], s = PULSE(k), a = s + FLIGHT, path = `M${p.x},${p.y + 10} L${HUB.x},${HUB.y} L${HAND.x},${HAND.y} L${BAR_X(k) + 5},${GROUND - BARS[k]}`;
        return (
          <circle key={`p${k}`} r={4.5} fill={RED} opacity={0}>
            <animateMotion dur={dur} repeatCount="indefinite" path={path} keyPoints="0;0;1;1" keyTimes={kt(0, s, a, T)} calcMode="linear" />
            <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={kt(0, s - 0.01, s, a - 0.05, a, T)} />
          </circle>
        );
      })}

      {/* 4. growth */}
      <g opacity={still ? 1 : 0}>
        {!still && <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={kt(0, G0 - 0.01, G0, F0, F1, T)} />}
        <path d={GROWTH} fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={GL} strokeDashoffset={still ? 0 : GL}>
          {!still && <animate attributeName="stroke-dashoffset" dur={dur} repeatCount="indefinite" values={`${GL};${GL};0;0`} keyTimes={kt(0, G0, G1, T)} />}
        </path>
        <circle cx={GROWTH_END.x} cy={GROWTH_END.y} r={5.5} fill={RED} opacity={still ? 1 : 0}>
          {!still && <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1" keyTimes={kt(0, G1 - 0.05, G1, T)} />}
        </circle>
      </g>

      <g fontFamily="var(--font-body), Poppins, sans-serif" fontSize="9.5" fontWeight="500" letterSpacing="2.6" fill={MUTE}>
        <text x={ENT.x - 22} y={GROUND + 26}>ENTREPRENEUR</text>
        <text x={318} y={102} textAnchor="end">INVESTORS</text>
      </g>
    </>
  );
}

export function HeroGrow() {
  return (
    <div className="hero-grow" aria-hidden="true">
      <svg className="hg-live" viewBox="0 70 340 370" width="100%"><Scene /></svg>
      <svg className="hg-still" viewBox="0 70 340 370" width="100%"><Scene still /></svg>
    </div>
  );
}
