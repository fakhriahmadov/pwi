import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { regionOf } from "./regions";

// ---------- Tags ----------
export const normTag = (s: string) =>
  s.trim().toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, "and").replace(/\s*:\s*/g, ":").replace(/[^a-z0-9:]+/g, "-").replace(/^-|-$/g, "");

/** Generation from birth year (Pew Research boundaries). */
export function generationOf(birthYear?: number | null) {
  if (!birthYear) return null;
  if (birthYear <= 1945) return "Silent Generation";
  if (birthYear <= 1964) return "Baby Boomers";
  if (birthYear <= 1980) return "Gen X";
  if (birthYear <= 1996) return "Gen Y (Millennials)";
  if (birthYear <= 2012) return "Gen Z";
  return "Gen Alpha";
}

const PREFIX_LABEL: Record<string, string> = { region: "Region", country: "Country", industry: "Industry", generation: "Generation", gender: "Gender" };
/** "generation:gen-x" → "Generation: Gen X"; "family-business" → "Family business". */
export function tagLabel(tag: string) {
  const [p, rest] = tag.includes(":") ? tag.split(/:(.*)/s) : ["", tag];
  const words = rest.split("-").map((w) => (w.length <= 3 && /^(gen|uae|usa|uk|us)$/.test(w) ? w.toUpperCase().replace("GEN", "Gen") : w));
  const text = words.join(" ").replace(/^./, (c) => c.toUpperCase()).replace(/\bGen (x|y|z)\b/gi, (_m, l) => `Gen ${l.toUpperCase()}`);
  return p ? `${PREFIX_LABEL[p] ?? p}: ${text}` : text;
}

// ---------- CSV ----------
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  const s = text.replace(/^﻿/, "");
  const delim = (s.split("\n")[0].match(/;/g)?.length ?? 0) > (s.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === '"' && s[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; continue; }
    if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && s[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const ALIASES: Record<string, string[]> = {
  year: ["year", "edition"],
  name: ["name", "person", "family"],
  country: ["country", "citizenship", "nationality"],
  region: ["region"],
  industry: ["industry", "sector"],
  netWorthBn: ["net_worth_usd_bn", "net_worth_bn", "net_worth", "networth", "wealth_usd_bn", "wealth_bn", "wealth"],
  birthYear: ["birth_year", "born", "year_of_birth"],
  gender: ["gender", "sex"],
  tags: ["tags", "tag", "labels", "categories"],
};

export type ImportResult = { ok: boolean; rows: number; years: number[]; errors: string[] };

/** Validates and imports a CSV. Rows for the years in the file replace any existing rows for those years. */
export async function importFortunes(text: string, filename: string, by?: string): Promise<ImportResult> {
  const table = parseCsv(text);
  if (table.length < 2) return { ok: false, rows: 0, years: [], errors: ["The file has no data rows."] };
  const head = table[0].map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_").replace(/[()$]/g, ""));
  const col: Record<string, number> = {};
  for (const [key, names] of Object.entries(ALIASES)) { const i = head.findIndex((h) => names.includes(h)); if (i >= 0) col[key] = i; }
  const missing = ["year", "country", "netWorthBn"].filter((k) => col[k] === undefined);
  if (missing.length) return { ok: false, rows: 0, years: [], errors: [`Missing column(s): ${missing.map((m) => ({ year: "year", country: "country", netWorthBn: "net_worth_usd_bn" })[m]).join(", ")}. The first row must hold the column names.`] };

  const errors: string[] = [];
  const out: Omit<Prisma.FortuneCreateManyInput, "uploadId">[] = [];
  table.slice(1).forEach((r, i) => {
    const line = i + 2;
    const get = (k: string) => (col[k] === undefined ? "" : (r[col[k]] ?? "").trim());
    const year = Number.parseInt(get("year"), 10);
    const worth = Number.parseFloat(get("netWorthBn").replace(/[^0-9.\-]/g, ""));
    const country = get("country");
    if (!year || year < 1900 || year > 2100) return void errors.push(`Line ${line}: year “${get("year")}” isn't a valid year.`);
    if (!country) return void errors.push(`Line ${line}: country is empty.`);
    if (!Number.isFinite(worth) || worth < 0) return void errors.push(`Line ${line}: net worth “${get("netWorthBn")}” isn't a number.`);
    const birth = Number.parseInt(get("birthYear"), 10) || null;
    const region = get("region") || regionOf(country);
    const industry = get("industry") || null;
    const gender = get("gender") || null;
    const gen = generationOf(birth);
    const custom = get("tags").split(/[;|]/).map(normTag).filter(Boolean);
    const auto = [`region:${normTag(region)}`, `country:${normTag(country)}`, industry && `industry:${normTag(industry)}`, gen && `generation:${normTag(gen.replace(/\s*\(.*\)/, ""))}`, gender && `gender:${normTag(gender)}`].filter(Boolean) as string[];
    out.push({ year, name: get("name") || null, country, region, industry, netWorthBn: worth, birthYear: birth, gender, tags: Array.from(new Set([...custom, ...auto])) });
  });
  if (errors.length) return { ok: false, rows: 0, years: [], errors: [...errors.slice(0, 15), ...(errors.length > 15 ? [`…and ${errors.length - 15} more.`] : [])] };

  const years = Array.from(new Set(out.map((o) => o.year))).sort();
  await db.$transaction(async (tx) => {
    const up = await tx.dataUpload.create({ data: { filename, rows: out.length, years, by } });
    await tx.fortune.deleteMany({ where: { year: { in: years } } });
    for (let i = 0; i < out.length; i += 1000) await tx.fortune.createMany({ data: out.slice(i, i + 1000).map((o) => ({ ...o, uploadId: up.id })) });
  }, { timeout: 60_000 });
  return { ok: true, rows: out.length, years, errors: [] };
}

// ---------- Index computation ----------
type Def = { allTags: string[]; anyTags: string[]; baseYear: number | null };
export type Point = { year: number; level: number; wealthBn: number; count: number };
export type Breakdown = { label: string; count: number; wealthBn: number; share: number }[];
export type IndexResult = {
  series: Point[]; latest?: Point; previous?: Point; changePct: number | null; baseYear?: number;
  byCountry: Breakdown; byRegion: Breakdown; byIndustry: Breakdown; byGeneration: Breakdown;
};

function where(d: Def) {
  const and: object[] = [];
  if (d.allTags.length) and.push({ tags: { hasEvery: d.allTags } });
  if (d.anyTags.length) and.push({ tags: { hasSome: d.anyTags } });
  return and.length ? { AND: and } : {};
}

function group(rows: { key: string | null; w: number }[], total: number, limit = 10): Breakdown {
  const m = new Map<string, { count: number; wealthBn: number }>();
  for (const r of rows) { const k = r.key || "Not stated"; const g = m.get(k) ?? { count: 0, wealthBn: 0 }; g.count++; g.wealthBn += r.w; m.set(k, g); }
  return [...m.entries()].map(([label, g]) => ({ label, ...g, share: total ? g.wealthBn / total : 0 })).sort((a, b) => b.wealthBn - a.wealthBn).slice(0, limit);
}

export async function computeIndex(d: Def): Promise<IndexResult> {
  const rows = await db.fortune.findMany({ where: where(d), select: { year: true, netWorthBn: true, country: true, region: true, industry: true, birthYear: true } });
  const years = Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b);
  const base = d.baseYear && years.includes(d.baseYear) ? d.baseYear : years[0];
  const sum = (y: number) => rows.filter((r) => r.year === y).reduce((s, r) => s + r.netWorthBn, 0);
  const baseTotal = base ? sum(base) : 0;
  const series = years.map((y) => { const w = sum(y); return { year: y, wealthBn: w, count: rows.filter((r) => r.year === y).length, level: baseTotal ? (w / baseTotal) * 100 : 0 }; });
  const latest = series.at(-1), previous = series.at(-2);
  const now = latest ? rows.filter((r) => r.year === latest.year) : [];
  const total = latest?.wealthBn ?? 0;
  return {
    series, latest, previous, baseYear: base,
    changePct: latest && previous && previous.wealthBn ? ((latest.wealthBn - previous.wealthBn) / previous.wealthBn) * 100 : null,
    byCountry: group(now.map((r) => ({ key: r.country, w: r.netWorthBn })), total),
    byRegion: group(now.map((r) => ({ key: r.region, w: r.netWorthBn })), total),
    byIndustry: group(now.map((r) => ({ key: r.industry, w: r.netWorthBn })), total),
    byGeneration: group(now.map((r) => ({ key: generationOf(r.birthYear), w: r.netWorthBn })), total),
  };
}

/** Every tag in the data with how many fortunes (latest year) carry it — for the admin tag picker. */
export async function tagCounts() {
  const latest = await db.fortune.aggregate({ _max: { year: true } });
  if (!latest._max.year) return [];
  const rows = await db.fortune.findMany({ where: { year: latest._max.year }, select: { tags: true } });
  const m = new Map<string, number>();
  for (const r of rows) for (const t of r.tags) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()].map(([tag, count]) => ({ tag, count, label: tagLabel(tag) })).sort((a, b) => a.tag.localeCompare(b.tag));
}

export const STARTER_INDEXES = [
  { name: "Global Wealth Index", slug: "global", description: "Every fortune in the dataset, worldwide.", allTags: [], anyTags: [], featured: true, color: "#0A0A0A" },
  { name: "EuroCapital Index", slug: "eurocapital", description: "Fortunes held by Europeans.", allTags: ["region:europe"], anyTags: [], color: "#C42F33" },
  { name: "Family Business Index", slug: "family-business", description: "Fortunes built on family-owned companies.", allTags: ["family-business"], anyTags: [], color: "#1E4FE0" },
  { name: "Gen X Index", slug: "gen-x", description: "Fortune holders born 1965–1980.", allTags: ["generation:gen-x"], anyTags: [], color: "#6B4E00" },
  { name: "Gen Y Index", slug: "gen-y", description: "Millennial fortune holders, born 1981–1996.", allTags: ["generation:gen-y"], anyTags: [], color: "#13307F" },
  { name: "Gen Z Index", slug: "gen-z", description: "Fortune holders born 1997–2012.", allTags: ["generation:gen-z"], anyTags: [], color: "#14532D" },
];
