import { db, dbConfigured } from "./db";

/**
 * Daily news ("Today in private wealth").
 * Every morning candidates are gathered from Google News search feeds — one feed per topic × region — into
 * Admin → News. Nothing reaches the site until an editor publishes it (headline, our one-line takeaway, key figure).
 * We show headlines, our own summary and a link to the source; never the article itself.
 */
export const REGIONS = [
  { key: "europe", label: "Europe", q: "(Europe OR UK OR Germany OR France OR Spain OR Italy OR Switzerland OR Netherlands OR Nordic)", gl: "GB" },
  { key: "middle-east", label: "Middle East", q: "(UAE OR Dubai OR \"Abu Dhabi\" OR Saudi OR Qatar OR Kuwait OR Israel OR \"Middle East\")", gl: "AE" },
  { key: "latam", label: "LATAM", q: "(Brazil OR Mexico OR Argentina OR Colombia OR Chile OR Peru OR \"Latin America\")", gl: "US" },
  { key: "asia", label: "Asia", q: "(China OR India OR Japan OR Singapore OR Korea OR Indonesia OR \"Hong Kong\" OR Asia)", gl: "SG" },
  { key: "north-america", label: "North America", q: "(\"United States\" OR US OR Canada OR \"Wall Street\" OR \"Silicon Valley\")", gl: "US" },
] as const;
export const TOPICS = [
  { key: "billionaires", label: "Billionaires", q: "(billionaire OR \"family office\" OR \"richest\" OR \"family fortune\")" },
  { key: "unicorns", label: "New unicorns", q: "(\"unicorn\" startup OR \"becomes a unicorn\" OR \"$1 billion valuation\" OR \"billion valuation\")" },
  { key: "bankruptcies", label: "Bankruptcies", q: "(bankruptcy OR insolvency OR \"files for bankruptcy\" OR \"Chapter 11\" OR administration collapse)" },
] as const;
export type RegionKey = (typeof REGIONS)[number]["key"];
export type TopicKey = (typeof TOPICS)[number]["key"];
export const regionLabel = (k: string) => REGIONS.find((r) => r.key === k)?.label ?? k;
export const topicLabel = (k: string) => TOPICS.find((t) => t.key === k)?.label ?? k;

export const feedUrl = (topic: (typeof TOPICS)[number], region: (typeof REGIONS)[number]) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(`${topic.q} ${region.q} when:2d`)}&hl=en&gl=${region.gl}&ceid=${region.gl}:en`;

const NAMED: Record<string, string> = { euro: "€", pound: "£", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", hellip: "…" };
const decode = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&(euro|pound|nbsp|ndash|mdash|rsquo|lsquo|ldquo|rdquo|hellip);/g, (_, e: string) => NAMED[e]).trim();
const tag = (xml: string, name: string) => { const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1]) : ""; };

export type Candidate = { title: string; url: string; source: string; publishedAt: Date };
/** Items of an RSS feed. Google News titles end in " - Source"; that part is moved to `source`. */
export function parseRss(xml: string): Candidate[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, it]) => {
    let title = tag(it, "title"); const source = tag(it, "source");
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    const d = new Date(tag(it, "pubDate"));
    return { title, url: tag(it, "link"), source, publishedAt: isNaN(+d) ? new Date() : d };
  }).filter((c) => c.title && /^https?:\/\//.test(c.url));
}

/** Gathers fresh candidates for every topic × region. Returns how many new ones were added. */
export async function gatherNews(opts: { perFeed?: number } = {}) {
  if (!dbConfigured()) return { added: 0, feeds: 0, failed: 0 };
  const per = opts.perFeed ?? 8;
  let added = 0, failed = 0, feeds = 0;
  await Promise.all(TOPICS.flatMap((t) => REGIONS.map(async (r) => {
    feeds++;
    try {
      const res = await fetch(feedUrl(t, r), { headers: { "user-agent": "Mozilla/5.0 (compatible; PWI-news/1.0)" }, signal: AbortSignal.timeout(12000), cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = parseRss(await res.text()).slice(0, per);
      const out = await db.newsItem.createMany({ data: items.map((c) => ({ ...c, topic: t.key, region: r.key })), skipDuplicates: true });
      added += out.count;
    } catch (e) { failed++; console.error(`[news] ${t.key}/${r.key}:`, (e as Error).message); }
  })));
  // Keep the inbox short: unpublished candidates older than ten days go.
  await db.newsItem.deleteMany({ where: { status: { not: "published" }, createdAt: { lt: new Date(Date.now() - 10 * 864e5) } } }).catch(() => {});
  return { added, feeds, failed };
}

export type StorySource = { name: string; url: string };
export type NewsCard = { id: string; slug: string; topic: string; region: string; title: string; takeaway: string | null; figure: string | null; sources: StorySource[]; eventDate: Date };
const card = (r: { id: string; slug: string; topic: string; region: string; title: string; takeaway: string | null; figure: string | null; sources: unknown; eventDate: Date }): NewsCard =>
  ({ id: r.id, slug: r.slug, topic: r.topic, region: r.region, title: r.title, takeaway: r.takeaway, figure: r.figure, sources: Array.isArray(r.sources) ? (r.sources as StorySource[]) : [], eventDate: r.eventDate });

/** Published stories for the homepage: per region, the latest (all themes mixed, newest first). */
export async function homeNews(perRegion = 5) {
  const empty = Object.fromEntries(REGIONS.map((r) => [r.key, [] as NewsCard[]])) as Record<string, NewsCard[]>;
  if (!dbConfigured()) return { byRegion: empty };
  try {
    const rows = await db.newsStory.findMany({ where: { status: "published" }, orderBy: [{ eventDate: "desc" }, { approvedAt: "desc" }], take: 300 });
    for (const r of rows) { const list = empty[r.region]; if (list && list.length < perRegion) list.push(card(r)); }
    return { byRegion: empty };
  } catch (e) { console.error("[news] database unavailable", e); return { byRegion: empty }; }
}

/** Published stories for /news, newest first. */
export async function allNews(region?: string) {
  if (!dbConfigured()) return [];
  return (await db.newsStory.findMany({ where: { status: "published", ...(region ? { region } : {}) }, orderBy: [{ eventDate: "desc" }, { approvedAt: "desc" }], take: 200 }).catch(() => [])).map(card);
}

/** One published story, and a few more from its region. */
export async function getStory(slug: string) {
  if (!dbConfigured()) return null;
  const s = await db.newsStory.findUnique({ where: { slug } }).catch(() => null);
  if (!s || s.status !== "published") return null;
  const more = await db.newsStory.findMany({ where: { status: "published", region: s.region, id: { not: s.id } }, orderBy: { eventDate: "desc" }, take: 4 });
  return { story: { ...card(s), body: s.body, aiDrafted: s.aiDrafted, approvedAt: s.approvedAt }, more: more.map(card) };
}
