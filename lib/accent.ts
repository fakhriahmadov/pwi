/** Event colours: one accent per event (e.g. Vienna blue, Ibiza yellow), with readable variants derived from it. */
const hex = (a?: string) => (/^#[0-9a-f]{6}$/i.test(a || "") ? a!.toUpperCase() : "#C42F33");
const rgb = (x: string) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
const toHex = (c: number[]) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
const mix = (x: string, y: string, t: number) => { const p = rgb(x), q = rgb(y); return toHex(p.map((v, i) => v + (q[i] - v) * t)); };
const lum = (x: string) => rgb(x).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (x: string, y: string) => { const p = lum(x), q = lum(y); return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05); };

export const ACCENT_PRESETS = [
  { label: "Brand red", value: "#C42F33" }, { label: "Summit blue", value: "#1E4FE0" }, { label: "Ibiza yellow", value: "#F5C400" },
  { label: "Emerald", value: "#1F7A5A" }, { label: "Bordeaux", value: "#6E1F2E" }, { label: "Black", value: "#0A0A0A" },
];

export function accent(a?: string) {
  const h = hex(a);
  // Text on light backgrounds: the event colour itself when it reads well on white (e.g. Vienna blue);
  // otherwise the brand red (e.g. Ibiza yellow) — never a muddy darkened version of the colour.
  const ink = contrast(h, "#FFFFFF") >= 4.5 ? h : "#C42F33";
  let onDark = h, t = 0; while (contrast(onDark, "#0A0A0A") < 4.5 && t < 1) { t += 0.05; onDark = mix(h, "#FFFFFF", t); }
  const fg = contrast(h, "#FFFFFF") >= contrast(h, "#0A0A0A") ? "#FFFFFF" : "#0A0A0A";
  return { hex: h, fg, ink, onDark, tint: mix(h, "#FFFFFF", 0.88) };
}

/** CSS variables for an event's accent: --acc, --acc-fg, --acc-ink (text on light), --acc-ondark (text on dark), --acc-tint. */
export function accentVars(a?: string): React.CSSProperties {
  const c = accent(a);
  return { ["--acc" as string]: c.hex, ["--acc-fg" as string]: c.fg, ["--acc-ink" as string]: c.ink, ["--acc-ondark" as string]: c.onDark, ["--acc-tint" as string]: c.tint, ["--on-acc" as string]: c.fg };
}
