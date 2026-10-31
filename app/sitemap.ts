import type { MetadataRoute } from "next";
import { getArticles, getTopics, topicSlug } from "@/lib/articles";
import { events } from "@/content/events";
import { site } from "@/content/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticles();
  const topics = await getTopics();
  const u = (p: string) => `${site.url}${p}`;
  return [
    ...["/", "/about", "/insights", "/research", "/events", "/contact", "/legal/imprint", "/legal/privacy"].map((p) => ({ url: u(p) })),
    ...articles.map((a) => ({ url: u(`/insights/${a.slug}`), lastModified: a.date })),
    ...topics.map((t) => ({ url: u(`/insights/topic/${topicSlug(t)}`) })),
    ...events.map((e) => ({ url: u(`/events/${e.slug}`) })),
  ];
}
