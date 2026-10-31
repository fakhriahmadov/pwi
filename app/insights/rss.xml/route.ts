import { getArticles } from "@/lib/articles";
import { site } from "@/content/site";

const x = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export async function GET() {
  const items = (await getArticles()).map((a) => `<item><title>${x(a.title)}</title><link>${site.url}/insights/${a.slug}</link><guid>${site.url}/insights/${a.slug}</guid><pubDate>${new Date(a.date).toUTCString()}</pubDate><description>${x(a.excerpt)}</description><category>${x(a.topic)}</category></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${x(site.name)} — Insights</title><link>${site.url}/insights</link><description>${x(site.tagline)}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
