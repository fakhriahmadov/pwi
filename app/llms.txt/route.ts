import { site } from "@/content/site";
import { getArticles } from "@/lib/articles";
import { getPublishedIndexes, fmtLevel, fmtPct } from "@/lib/research";
import { allNews, regionLabel } from "@/lib/news";
import { upcomingEvents } from "@/lib/events";
import { abs } from "@/lib/seo";

export const revalidate = 3600;

/** /llms.txt — a plain-text guide for AI assistants (llmstxt.org): who we are, what we publish, and the pages worth reading. */
export async function GET() {
  const [articles, indexes, news, events] = await Promise.all([getArticles(), getPublishedIndexes(), allNews(), upcomingEvents()]);
  const line = (t: string, p: string, d?: string | null) => `- [${t.replace(/[\[\]]/g, "")}](${abs(p)})${d ? `: ${d.replace(/\s+/g, " ").trim()}` : ""}`;
  const out = [
    `# ${site.name}`,
    "",
    `> ${site.tagline} Independent research, global wealth indexes, a daily brief on fortunes, new companies and failures by region, and private summits (Future. Summit) for founders, families and the people shaping private capital.`,
    "",
    "Content may be quoted with attribution to the Private Wealth Institute and a link to the page. Figures in the daily brief come from the outlets listed on each story; index levels come from the institute's own dataset (base year = 100).",
    "",
    "## Key pages",
    line("About the institute", "/about", "Who we are and what we do"),
    line("Insights", "/insights", "Indexes, research and commentary"),
    line("Daily brief (news)", "/news", "Fortunes, new companies and failures that matter to owners and families, by region; written by the institute from several sources"),
    line("Events", "/events", "Future. Summit — one-day private conversations"),
    line("Contact", "/contact", `Partnerships, press, speaking and research requests (${site.email})`),
    "",
    "## Wealth indexes",
    ...indexes.map((i) => line(i.name, `/indexes/${i.slug}`, `${i.description ? i.description + " " : ""}${i.result.latest ? `Level ${fmtLevel(i.result.latest.level)} in ${i.result.latest.year} (${fmtPct(i.result.changePct)} on the previous year).` : ""}`)),
    "",
    "## Research and commentary",
    ...articles.slice(0, 30).map((a) => line(a.title, `/insights/${a.slug}`, `${a.topic}, ${a.date}. ${a.excerpt || ""}`)),
    "",
    "## Latest from the daily brief",
    ...news.slice(0, 40).map((n) => line(n.title, `/news/${n.slug}`, `${regionLabel(n.region)}, ${n.eventDate.toISOString().slice(0, 10)}.${n.figure ? ` Key figure: ${n.figure}.` : ""} ${n.takeaway || ""}`)),
    ...(events.length ? ["", "## Upcoming events", ...events.map((e) => line(`${e.series} ${e.city}`, `/events/${e.slug}`, `${e.date}${e.venue ? `, ${e.venue}` : ""}`))] : []),
    "",
    "## Feeds",
    line("Daily brief RSS", "/news/rss.xml"),
    line("Insights RSS", "/insights/rss.xml"),
    line("Sitemap", "/sitemap.xml"),
    "",
  ].join("\n");
  return new Response(out, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
