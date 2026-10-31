import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { db, dbConfigured } from "./db";
import { renderMarkdown, readTime } from "./markdown";
import { mediaUrl } from "./about";

export type Article = {
  slug: string;
  legacySlug?: string;
  title: string;
  excerpt: string;
  topic: string;
  date: string;
  read?: string;
  author: string;
  image?: string;
  featured?: boolean;
  html: string;
  source: "file" | "db";
};

const DIR = path.join(process.cwd(), "content/articles");

/** Articles kept as Markdown files in content/articles (the original set). */
export function getFileArticles() {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR).filter((f) => f.endsWith(".md")).map((file) => {
    const { data, content } = matter(fs.readFileSync(path.join(DIR, file), "utf8"));
    return {
      slug: file.replace(/\.md$/, ""),
      legacySlug: data.legacySlug ? String(data.legacySlug) : undefined,
      title: String(data.title),
      excerpt: String(data.excerpt ?? ""),
      topic: String(data.topic ?? "Insights"),
      date: String(data.date),
      read: data.read ? String(data.read) : undefined,
      author: String(data.author ?? "Private Wealth Institute"),
      body: content.replace(/<!--[\s\S]*?-->/g, "").trim(),
    };
  });
}

/** Published articles: those written in the admin, plus any file article not yet imported. */
export async function getArticles(): Promise<Article[]> {
  const bySlug = new Map<string, Article>();
  for (const f of getFileArticles()) bySlug.set(f.slug, { ...f, html: renderMarkdown(f.body), source: "file" });
  if (dbConfigured()) {
    try {
      const rows = await db.article.findMany({ where: { status: "published" } });
      const all = await db.article.findMany({ select: { slug: true } });
      for (const r of all) bySlug.delete(r.slug); // imported or drafted: the admin version wins
      for (const r of rows)
        bySlug.set(r.slug, {
          slug: r.slug, legacySlug: r.legacySlug ?? undefined, title: r.title, excerpt: r.excerpt, topic: r.topic, date: r.date,
          read: readTime(r.body), author: r.author, image: mediaUrl(r.coverId) ?? undefined, featured: r.featured,
          html: renderMarkdown(r.body), source: "db",
        });
    } catch (e) {
      console.error("[articles] database unavailable, showing file articles only", e);
    }
  }
  return [...bySlug.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getArticle(slug: string) {
  return (await getArticles()).find((a) => a.slug === slug);
}

export async function findByLegacySlug(slug: string) {
  return (await getArticles()).find((a) => a.legacySlug === slug);
}

export async function getTopics() {
  return Array.from(new Set((await getArticles()).map((a) => a.topic)));
}

/** The featured article: the one marked featured, else the newest. */
export const pickFeatured = <T extends { featured?: boolean }>(list: T[]) => list.find((a) => a.featured) ?? list[0];

export const topicSlug = (t: string) =>
  t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
