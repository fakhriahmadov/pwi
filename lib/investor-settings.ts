import type { Section, Values } from "./fields";

/**
 * Admin → Investors: the explanation on the investor page, and every number the fund simulator uses.
 * Stored like a page (draft / publish) under the key "investors". Values are kept in the units the admin
 * types (%, €k, €m); `simulatorConfig` turns them into the units of the model.
 */
export const ICONS = ["building", "renovate", "sun", "coins", "exit", "sliders", "scenarios", "chart", "document", "shield", "people", "key"] as const;
const iconOptions = ICONS.map((i) => ({ value: i, label: i[0].toUpperCase() + i.slice(1) }));

const pct = (key: string, label: string, help?: string) => ({ key, label: `${label} (%)`, type: "number" as const, help });
const num = (key: string, label: string, help?: string) => ({ key, label, type: "number" as const, help });

/** Sliders: [key, label, unit shown on the slider, default min, default max] */
export const SLIDERS: [string, string, string, number, number][] = [
  ["keys", "Rooms (keys)", "rooms", 30, 90],
  ["ppk", "Purchase price a key", "€m", 0.2, 0.6],
  ["works", "Renovation a key", "€k", 100, 300],
  ["adr", "Room rate, season average", "€", 350, 750],
  ["occ", "Occupancy while open", "%", 50, 92],
  ["stay", "Average stay", "nights", 3, 10],
  ["growth", "Room rate growth a year", "%", 0, 5],
  ["ltv", "Bank debt, share of price and works", "%", 0, 65],
  ["rate", "Interest rate", "%", 3, 8],
  ["exit", "Exit yield, year 7 sale", "%", 4.5, 8],
  ["ticket", "Amount invested", "€", 250000, 5000000],
];

export const INVESTOR_SECTIONS: Section[] = [
  { title: "Investor page — how the fund works", help: "Shown above the simulator, with an icon for each step.", fields: [
    { key: "introTitle", label: "Title", type: "text" },
    { key: "introText", label: "Introduction", type: "textarea" },
    { key: "steps", label: "Steps", type: "list", itemLabel: "Step", max: 6, fields: [
      { key: "icon", label: "Icon", type: "select", options: iconOptions }, { key: "title", label: "Title", type: "text" }, { key: "text", label: "Text", type: "textarea" } ] },
  ] },
  { title: "Investor page — using the simulator", help: "Short tips shown just above the simulator.", fields: [
    { key: "tips", label: "Tips", type: "list", itemLabel: "Tip", max: 6, fields: [
      { key: "icon", label: "Icon", type: "select", options: iconOptions }, { key: "title", label: "Title", type: "text" }, { key: "text", label: "Text", type: "textarea" } ] },
    { key: "disclaimer", label: "Note under the tips", type: "textarea" },
  ] },
  { title: "Base case", help: "Where every slider starts, and what “Base case” resets to.", fields: [
    num("keys", "Rooms (keys)"), num("ppk", "Purchase price a key (€m)"), num("works", "Renovation a key, all-in (€k)"),
    num("adr", "Room rate, season average (€)", "From year 2, after the works."), num("adr0", "Room rate in year 1, before the works (€)"),
    pct("occ", "Occupancy while open", "78.457… is the season’s average occupancy in the model, so the base case uses the monthly pattern exactly. Round it if you prefer — results move only slightly."), num("stay", "Average stay (nights)"), pct("growth", "Room rate growth a year"),
    pct("ltv", "Bank debt, share of price and works"), pct("rate", "Interest rate"), pct("exit", "Exit yield, year 7 sale"),
    num("ticket", "Amount invested shown first (€)"),
    { key: "bundle", label: "Equipped room", type: "select", options: [{ value: "yes", label: "On" }, { value: "no", label: "Off" }] },
    { key: "season", label: "Season", type: "select", options: [{ value: "base", label: "April to October" }, { value: "long", label: "Long season, March to November" }] },
  ] },
  { title: "Scenarios", help: "The Downside and Upside buttons. Anything not listed here stays at the base case.", fields: [
    num("downAdr", "Downside — room rate (€)"), pct("downOcc", "Downside — occupancy"), pct("downGrowth", "Downside — room rate growth"), pct("downExit", "Downside — exit yield"),
    num("upAdr", "Upside — room rate (€)"), pct("upOcc", "Upside — occupancy"), pct("upGrowth", "Upside — room rate growth"), pct("upExit", "Upside — exit yield"),
  ] },
  { title: "Fund terms", fields: [
    pct("pref", "Preferred return a year"), pct("perf", "Performance fee, with full catch-up"), pct("fee", "Sponsor fee a year", "On commitments in years 1–2, then on equity."),
    num("minTicket", "Minimum investment (€)"),
  ] },
  { title: "Costs and taxes", fields: [
    pct("acq", "Transfer tax and deal costs, share of the price"), num("preOpen", "Pre-opening costs a key (€k)"),
    num("setup", "Fund set-up costs (€m)"), num("reserve", "Cash reserve (€m)", "Kept in the fund and returned at the end."), num("buffer", "Commitment buffer, not called (€m)"),
    num("runCost", "Fund running costs a year (€m)"), pct("tax", "Corporate tax in the hotel company"), pct("saleCost", "Sale costs at exit, share of the price"),
    num("bundleCost", "Equipped room — cost a stay (€)"),
  ] },
  { title: "Hotel operating costs", fields: [
    pct("opFee", "Operator base fee, share of revenue"), pct("opInc", "Operator incentive fee, share of GOP"),
    num("fixedBase", "Fixed costs a year (€)"), num("fixedPk", "Fixed costs a year per key (€)"), num("ohSeason", "Seasonal overhead a year (€)"),
  ] },
  { title: "Slider ranges", help: "Lowest and highest value on each slider, in the units shown on the slider.", fields:
    SLIDERS.flatMap(([k, l, u]) => [num(`min_${k}`, `${l} — lowest (${u})`), num(`max_${k}`, `${l} — highest (${u})`)]) },
];

export const INVESTOR_DEFAULTS: Values = {
  introTitle: "How European Lifestyle Fund 1 works",
  introText: "One fund, one hotel: we buy a seasonal hotel on the Spanish coast, reposition it, run it for seven years and sell it. The simulator below lets you change every key assumption and see what it means for your investment.",
  steps: [
    { icon: "building", title: "Buy", text: "A seasonal hotel of around 60 rooms on the Spanish coast, bought at a fair price a key." },
    { icon: "renovate", title: "Reposition", text: "Works in the first winter turn it into an upscale lifestyle hotel." },
    { icon: "sun", title: "Operate", text: "An experienced operator runs it each season, April to October." },
    { icon: "coins", title: "Distribute", text: "Cash beyond the reserve is paid out to investors from year 2." },
    { icon: "exit", title: "Sell", text: "The hotel is sold in year 7, and the proceeds are shared after the preferred return." },
  ],
  tips: [
    { icon: "sliders", title: "Move the sliders", text: "Every assumption — price, works, room rate, occupancy, debt — updates the results at once." },
    { icon: "scenarios", title: "Try the scenarios", text: "Downside, Base and Upside show the range we plan for." },
    { icon: "chart", title: "Read the results", text: "Net return, money multiple and yearly cash flows, before and after fees." },
    { icon: "document", title: "Ask for the presentation", text: "Download your scenario as a PDF, or ask us for the full presentation." },
  ],
  disclaimer: "Illustrations only, not an offer. Any offer is made only through the final fund documents.",
  keys: 60, ppk: 0.35, works: 187.5, adr: 520, adr0: 300, occ: 78.457286432, stay: 5, growth: 3, ltv: 50, rate: 5, exit: 5.5, ticket: 1000000, bundle: "yes", season: "base",
  downAdr: 460, downOcc: 70.6, downGrowth: 2, downExit: 6.5, upAdr: 600, upOcc: 80.8, upGrowth: 3, upExit: 5,
  pref: 8, perf: 20, fee: 0.5, minTicket: 250000,
  acq: 11, preOpen: 5, setup: 0.23, reserve: 0.75, buffer: 0.3, runCost: 0.1795, tax: 25, saleCost: 2, bundleCost: 70,
  opFee: 7, opInc: 8, fixedBase: 250000, fixedPk: 5300, ohSeason: 150000,
  ...Object.fromEntries(SLIDERS.flatMap(([k, , , lo, hi]) => [[`min_${k}`, lo], [`max_${k}`, hi]])),
};

/** Admin values (in admin units) → the model's settings (window.ELF_CFG). */
export function simulatorConfig(v: Values) {
  const n = (k: string, d = Number(INVESTOR_DEFAULTS[k])) => { const x = Number(v[k]); return Number.isFinite(x) && v[k] !== "" && v[k] != null ? x : d; };
  const p = (k: string) => n(k) / 100;
  const base = {
    keys: n("keys"), ppk: n("ppk"), works: n("works"), adr: n("adr"), adr0: n("adr0"), occ: n("occ"), stay: n("stay"), growth: p("growth"),
    ltv: p("ltv"), rate: p("rate"), exit: p("exit"), ticket: n("ticket"), bundle: v.bundle !== "no", season: v.season === "long" ? "long" : "base",
  };
  const presets = {
    downside: { adr: n("downAdr"), occ: n("downOcc"), growth: p("downGrowth"), exit: p("downExit") },
    base: {},
    upside: { adr: n("upAdr"), occ: n("upOcc"), growth: p("upGrowth"), exit: p("upExit") },
  };
  const terms = {
    pref: p("pref"), perf: p("perf"), fee: p("fee"), minTicket: n("minTicket"),
    acq: p("acq"), preOpen: n("preOpen") / 1000, setup: n("setup"), reserve: n("reserve"), buffer: n("buffer"), runCost: n("runCost"),
    tax: p("tax"), saleCost: p("saleCost"), bundle: n("bundleCost"), opFee: p("opFee"), opInc: p("opInc"),
    fixedBase: n("fixedBase"), fixedPk: n("fixedPk"), ohSeason: n("ohSeason"),
  };
  const ranges = Object.fromEntries(SLIDERS.map(([k]) => [k, { min: n(`min_${k}`), max: n(`max_${k}`) }]));
  return { base, presets, terms, ranges };
}

/** The numbers quoted in the simulator's text, formatted like the text around them. */
export function simulatorTokens(c: ReturnType<typeof simulatorConfig>): Record<string, string> {
  const pc = (x: number) => `${+(x * 100).toFixed(2)}%`;
  const m = (x: number) => `€${+x.toFixed(2)}m`;
  return {
    "%%FEE%%": pc(c.terms.fee), "%%PERF%%": pc(c.terms.perf), "%%PREF%%": pc(c.terms.pref), "%%ACQ%%": pc(c.terms.acq), "%%TAX%%": pc(c.terms.tax),
    "%%RUN%%": m(c.terms.runCost), "%%RESERVE%%": m(c.terms.reserve), "%%BUNDLE%%": `€${Math.round(c.terms.bundle)}`,
    "%%MINTICKET%%": `€${Math.round(c.terms.minTicket).toLocaleString("en-GB")}`,
  };
}
