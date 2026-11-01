import type { MetadataRoute } from "next";
import { getArticles, getTopics, topicSlug } from "@/lib/articles";
import { allEvents } from "@/lib/events";
import { site } from "@/content/site";
import { getPublishedIndexes } from "@/lib/research";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticles();
  const topics = await getTopics();
  const u = (p: string) => `${site.url}${p}`;
  return [
    ...["/", "/about", "/insights", "/insights/articles", "/events", "/contact", "/legal/imprint", "/legal/privacy"].map((p) => ({ url: u(p) })),
    ...articles.map((a) => ({ url: u(`/insights/${a.slug}`), lastModified: a.date })),
    ...topics.map((t) => ({ url: u(`/insights/topic/${topicSlug(t)}`) })),
    ...(await getPublishedIndexes()).map((i) => ({ url: u(`/indexes/${i.slug}`) })),
    ...(await allEvents()).map((e) => ({ url: u(`/events/${e.slug}`) })),
  ];
}
