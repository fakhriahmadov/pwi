import { db, dbConfigured } from "./db";
import { computeIndex, type IndexResult } from "./indexes";

export type PublicIndex = { slug: string; name: string; description: string; color: string; featured: boolean; allTags: string[]; anyTags: string[]; result: IndexResult };

export async function getPublishedIndexes(): Promise<PublicIndex[]> {
  if (!dbConfigured()) return [];
  try {
    const defs = await db.indexDef.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { name: "asc" }] });
    return Promise.all(defs.map(async (d) => ({ slug: d.slug, name: d.name, description: d.description, color: d.color, featured: d.featured, allTags: d.allTags, anyTags: d.anyTags, result: await computeIndex(d) })));
  } catch (e) {
    console.error("[research] database unavailable", e);
    return [];
  }
}

export const featuredIndex = (list: PublicIndex[]) => list.find((i) => i.featured) ?? list[0];

const nf1 = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
export const fmtLevel = (n?: number) => (n == null ? "—" : nf1.format(n));
export const fmtPct = (n: number | null | undefined) => (n == null ? "—" : `${n >= 0 ? "+" : "−"}${nf1.format(Math.abs(n))}%`);
export const fmtBn = (n?: number) => (n == null ? "—" : n >= 1000 ? `€${nf1.format(n / 1000)} tn` : `€${nf1.format(n)} bn`);

/** Size of the whole dataset in its latest year (independent of any index). */
export async function datasetSummary(): Promise<{ year: number; count: number; countries: number } | null> {
  if (!dbConfigured()) return null;
  try {
    const max = await db.fortune.aggregate({ _max: { year: true } });
    const year = max._max.year;
    if (!year) return null;
    const [count, countries] = await Promise.all([db.fortune.count({ where: { year } }), db.fortune.groupBy({ by: ["country"], where: { year } })]);
    return { year, count, countries: countries.length };
  } catch { return null; }
}
