import { allNews, regionLabel } from "@/lib/news";
import { site } from "@/content/site";
import { abs } from "@/lib/seo";

export const revalidate = 900;
const x = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

/** RSS feed of the daily brief, so readers, aggregators and AI tools can follow it. */
export async function GET() {
  const items = (await allNews()).slice(0, 60).map((n) => `<item><title>${x(n.title)}</title><link>${abs(`/news/${n.slug}`)}</link><guid>${abs(`/news/${n.slug}`)}</guid><pubDate>${n.eventDate.toUTCString()}</pubDate><description>${x(n.takeaway || "")}</description><category>${x(regionLabel(n.region))}</category></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${x(site.name)} — Daily brief</title><link>${abs("/news")}</link><description>Fortunes, new companies and failures that matter to owners and families, by region.</description><language>en-gb</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
