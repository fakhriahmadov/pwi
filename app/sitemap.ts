import type { MetadataRoute } from "next";
import { getArticles, getTopics, topicSlug } from "@/lib/articles";
import { events } from "@/content/events";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${site.url}${p}`;
  return [
    ...["/", "/about", "/insights", "/research", "/events", "/contact", "/legal/imprint", "/legal/privacy"].map((p) => ({ url: u(p) })),
    ...getArticles().map((a) => ({ url: u(`/insights/${a.slug}`), lastModified: a.date })),
    ...getTopics().map((t) => ({ url: u(`/insights/topic/${topicSlug(t)}`) })),
    ...events.map((e) => ({ url: u(`/events/${e.slug}`) })),
  ];
}
