import type { PublicIndex } from "./research";
import type { Breakdown, Point } from "./indexes";

/**
 * The final prototype's sample indexes (2016–2025). Shown on the public site only while no index has been
 * published in Admin → Research, so the pages look exactly like the prototype by default.
 */
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const SAMPLE = [
  { slug: "global", name: "Global Wealth Index", description: "Every fortune in the dataset, worldwide.", color: "#0A0A0A", featured: true, all: [] as string[], any: [] as string[], levels: [100, 108, 104, 117, 121, 139, 126, 134, 147, 155], count: 2840, wealth: 13050 },
  { slug: "eurocapital", name: "EuroCapital Index", description: "Fortunes held by Europeans.", color: "#C42F33", featured: false, all: ["region:Europe"], any: [], levels: [100, 106, 101, 111, 109, 124, 113, 119, 127, 132], count: 712, wealth: 3160 },
  { slug: "family-business", name: "Family Business Index", description: "Fortunes built on family-owned companies.", color: "#5E5A54", featured: false, all: ["theme:Family business"], any: [], levels: [100, 105, 103, 110, 112, 123, 119, 124, 131, 136], count: 1215, wealth: 5420 },
  { slug: "gen-x", name: "Gen X Index", description: "Fortune holders born 1965–1980.", color: "#8C877F", featured: false, all: [], any: ["generation:Gen X"], levels: [100, 109, 107, 121, 127, 146, 133, 143, 156, 166], count: 690, wealth: 2870 },
  { slug: "gen-y", name: "Gen Y Index", description: "Millennial fortune holders, born 1981–1996.", color: "#3D3B38", featured: false, all: [], any: ["generation:Gen Y"], levels: [100, 118, 121, 147, 168, 214, 181, 206, 242, 268], count: 164, wealth: 610 },
];
const bd = (rows: [string, number, number][]): Breakdown => { const t = rows.reduce((s, r) => s + r[1], 0); return rows.map(([label, wealthBn, count]) => ({ label, wealthBn, count, share: t ? wealthBn / t : 0 })); };
const EURO = {
  byRegion: bd([["Europe", 3160, 712]]),
  byCountry: bd([["Germany", 742, 152], ["France", 668, 98], ["Switzerland", 401, 76], ["Italy", 352, 81], ["United Kingdom", 318, 74], ["Spain", 205, 46], ["Sweden", 174, 52], ["Netherlands", 96, 24]]),
  byIndustry: bd([["Fashion & retail", 612, 88], ["Manufacturing", 498, 126], ["Finance & investments", 455, 97], ["Technology", 301, 71], ["Food & beverage", 287, 64], ["Real estate", 244, 58], ["Healthcare", 198, 49]]),
  byGeneration: bd([["Baby Boomers", 1310, 251], ["Silent Generation", 702, 112], ["Gen X", 612, 164], ["Not stated", 418, 151], ["Gen Y (Millennials)", 109, 31], ["Gen Z", 9, 3]]),
};

export const SAMPLE_INDEXES: PublicIndex[] = SAMPLE.map((s) => {
  const n = YEARS.length, base = s.wealth / (s.levels[n - 1] / 100);
  const series: Point[] = YEARS.map((year, k) => ({ year, level: s.levels[k], wealthBn: Math.round(base * s.levels[k] / 100 * 10) / 10, count: k === n - 1 ? s.count : Math.round(s.count * (0.74 + 0.26 * k / (n - 1))) }));
  const latest = series[n - 1], previous = series[n - 2];
  const empty: Breakdown = [];
  return {
    slug: s.slug, name: s.name, description: s.description, color: s.color, featured: s.featured, allTags: s.all, anyTags: s.any,
    result: { series, latest, previous, changePct: (latest.level / previous.level - 1) * 100, baseYear: YEARS[0],
      ...(s.slug === "eurocapital" ? EURO : { byRegion: empty, byCountry: empty, byIndustry: empty, byGeneration: empty }) },
  };
});
export const SAMPLE_DATASET = { year: 2025, count: 2840, countries: 74 };
