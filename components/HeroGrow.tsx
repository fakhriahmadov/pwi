/**
 * Home hero, desktop: a builder and an investor. Capital (red) arcs from the investor to the
 * builder's tower; every coin that lands adds a floor, and a growth line rises once it is built.
 * Pure SVG (SMIL), one 9-second loop, no JavaScript. Hidden below 1200px; still image for reduced motion.
 */
const T = 9; // seconds per loop
const GROUND = 392, BW = 80, BX = 100, BH = 34, GAP = 6;
const blockTop = (k: number) => GROUND - (k + 1) * (BH + GAP) + GAP;
const FLOORS = [0, 1, 2, 3, 4];
const start = (k: number) => 0.8 + 1.15 * k; // coin leaves the investor
const FLIGHT = 0.9;
const arrive = (k: number) => start(k) + FLIGHT;
const G0 = arrive(4) + 0.25, G1 = G0 + 0.9; // growth line draws
const F0 = 8.15, F1 = 8.65; // everything fades, then the loop restarts
const kt = (...t: number[]) => t.map((x) => Math.min(1, Math.max(0, x / T)).toFixed(4)).join(";");
const HAND = { x: 252, y: 332 };
const coinPath = (k: number) => { const ty = blockTop(k) + BH / 2; return `M${HAND.x},${HAND.y} Q${(HAND.x + BX + BW / 2) / 2 + 20},${blockTop(k) - 78} ${BX + BW / 2},${ty}`; };
const GROWTH = "M140,186 L160,150 L178,162 L212,98";
const GROWTH_LEN = 200;

function Figure({ x, arm }: { x: number; arm: string }) {
  return (
    <g fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx={x} cy={296} r={12} />
      <path d={`M${x - 22},${GROUND} L${x - 18},340 Q${x},322 ${x + 18},340 L${x + 22},${GROUND}`} />
      <path d={arm} />
    </g>
  );
}

/** The builder at work: hard hat, hammer swinging against the tower, a small spark on each strike. */
const SWING = "0.7s";
function Builder({ still }: { still?: boolean }) {
  const x = 46, SH = { x: 60, y: 344 };
  return (
    <g fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <g>
        {!still && <animateTransform attributeName="transform" type="translate" dur={SWING} repeatCount="indefinite" values="0 0;0 1.6;0 0" keyTimes="0;.5;1" calcMode="spline" keySplines=".4 0 .6 1;.4 0 .6 1" />}
        <circle cx={x} cy={296} r={12} />
        {/* hard hat */}
        <path d={`M${x - 12},${292} A12,12 0 0 1 ${x + 12},${292}`} fill="#FFFFFF" stroke="none" />
        <path d={`M${x - 15},${292.5} H${x + 15}`} />
        <path d={`M${x - 22},${GROUND} L${x - 18},340 Q${x},322 ${x + 18},340 L${x + 22},${GROUND}`} />
        {/* arm + hammer, swinging from the shoulder */}
        <g>
          {!still && <animateTransform attributeName="transform" type="rotate" dur={SWING} repeatCount="indefinite"
            values={`-34 ${SH.x} ${SH.y};4 ${SH.x} ${SH.y};-34 ${SH.x} ${SH.y}`} keyTimes="0;.5;1" calcMode="spline" keySplines=".55 0 1 .45;.2 .6 .4 1" />}
          <path d={`M${SH.x},${SH.y} L84,352`} />
          <path d="M84,352 L90,338" />
          <rect x={85} y={332} width={13} height={6} fill="#FFFFFF" stroke="none" transform="rotate(22 91 335)" />
        </g>
      </g>
      {/* spark where the hammer meets the tower */}
      {!still && (
        <g stroke="#FFFFFF" strokeWidth="1.2" opacity={0}>
          <animate attributeName="opacity" dur={SWING} repeatCount="indefinite" values="0;0;1;0;0" keyTimes="0;.46;.52;.7;1" />
          <path d="M99,336 l5,-4 M100,342 l6,0 M99,348 l5,4" />
        </g>
      )}
    </g>
  );
}

function Scene({ still }: { still?: boolean }) {
  const dur = `${T}s`;
  return (
    <>
      <defs>
        <radialGradient id={`hgFade${still ? "S" : "L"}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#0A0A0A" stopOpacity="1" /><stop offset=".65" stopColor="#0A0A0A" stopOpacity=".92" /><stop offset="1" stopColor="#0A0A0A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={170} cy={300} rx={230} ry={190} fill={`url(#hgFade${still ? "S" : "L"})`} />
      {/* ground and the plan (dashed) the builder wants to build */}
      <path d={`M0,${GROUND} H340`} stroke="var(--ink-line)" strokeWidth="1.2" />
      {FLOORS.map((k) => <rect key={`p${k}`} x={BX} y={blockTop(k)} width={BW} height={BH} fill="none" stroke="#5E5A54" strokeWidth="1" strokeDasharray="3 5" />)}

      <Builder still={still} />
      <Figure x={296} arm={`M282,346 L${HAND.x + 4},${HAND.y + 2}`} />

      {/* floors appear as capital arrives */}
      {FLOORS.map((k) => (
        <g key={`b${k}`} opacity={still ? 1 : 0}>
          {!still && <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={kt(0, arrive(k), arrive(k) + 0.25, F0, F1, T)} />}
          {!still && <animateTransform attributeName="transform" type="translate" dur={dur} repeatCount="indefinite" values="0 -10;0 -10;0 0;0 0" keyTimes={kt(0, arrive(k), arrive(k) + 0.3, T)} />}
          <rect x={BX} y={blockTop(k)} width={BW} height={BH} fill={k === 4 ? "rgba(255,255,255,.06)" : "none"} stroke="#FFFFFF" strokeWidth="1.6" />
          <path d={`M${BX + 14},${blockTop(k) + BH / 2} H${BX + 30} M${BX + 50},${blockTop(k) + BH / 2} H${BX + 66}`} stroke="#B5B0A8" strokeWidth="1.2" />
        </g>
      ))}

      {/* capital: red coins arc from the investor's hand to the next floor */}
      {!still && FLOORS.map((k) => (
        <circle key={`c${k}`} r={5} fill="#E5484A" opacity={0}>
          <animateMotion dur={dur} repeatCount="indefinite" path={coinPath(k)} keyPoints="0;0;1;1" keyTimes={kt(0, start(k), arrive(k), T)} calcMode="linear" />
          <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={kt(0, start(k) - 0.01, start(k), arrive(k) - 0.05, arrive(k), T)} />
        </circle>
      ))}

      {/* growth once it is built */}
      <g opacity={still ? 1 : 0}>
        {!still && <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={kt(0, G0 - 0.01, G0, F0, F1, T)} />}
        <path d={GROWTH} fill="none" stroke="#E5484A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={GROWTH_LEN} strokeDashoffset={still ? 0 : GROWTH_LEN}>
          {!still && <animate attributeName="stroke-dashoffset" dur={dur} repeatCount="indefinite" values={`${GROWTH_LEN};${GROWTH_LEN};0;0`} keyTimes={kt(0, G0, G1, T)} />}
        </path>
        <circle cx={212} cy={98} r={6} fill="#E5484A" opacity={still ? 1 : 0}>
          {!still && <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1" keyTimes={kt(0, G1 - 0.05, G1, T)} />}
        </circle>
      </g>

      <g fontFamily="var(--font-body), Poppins, sans-serif" fontSize="10" fontWeight="500" letterSpacing="3" textAnchor="middle">
        <text x={46} y={422} fill="#B5B0A8">BUILDER</text>
        <text x={296} y={422} fill="#B5B0A8">INVESTOR</text>
        <text x={296} y={258} fill="#E5484A">CAPITAL</text>
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
