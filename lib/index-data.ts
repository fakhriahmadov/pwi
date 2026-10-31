import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "content/index");

function readCsv(file: string): Record<string, string>[] {
  const p = path.join(DIR, file);
  if (!fs.existsSync(p)) return [];
  const lines = fs.readFileSync(p, "utf8").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const head = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((l) => {
    const cells = l.split(",");
    return Object.fromEntries(head.map((h, i) => [h, (cells[i] ?? "").trim()]));
  });
}

export type Point = { date: string; value: number };
export type RankRow = { edition: string; country: string; billionaires: number; wealthBn: number; changePct: number; leadingIndustry: string };

export function getSeries(): Point[] {
  return readCsv("series.csv")
    .map((r) => ({ date: r.date, value: Number(r.value) }))
    .filter((p) => p.date && Number.isFinite(p.value))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getRanking(): RankRow[] {
  return readCsv("ranking.csv")
    .map((r) => ({
      edition: r.edition,
      country: r.country,
      billionaires: Number(r.billionaires),
      wealthBn: Number(r.wealth_eur_bn),
      changePct: Number(r.change_pct),
      leadingIndustry: r.leading_industry,
    }))
    .sort((a, b) => b.wealthBn - a.wealthBn);
}
