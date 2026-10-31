import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

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
  html: string;
};

const DIR = path.join(process.cwd(), "content/articles");

let cache: Article[] | null = null;

export function getArticles(): Article[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const list = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const { data, content } = matter(fs.readFileSync(path.join(DIR, file), "utf8"));
      return {
        slug: file.replace(/\.md$/, ""),
        legacySlug: data.legacySlug,
        title: String(data.title),
        excerpt: String(data.excerpt ?? ""),
        topic: String(data.topic ?? "Insights"),
        date: String(data.date),
        read: data.read ? String(data.read) : undefined,
        author: String(data.author ?? "Private Wealth Institute"),
        image: data.image ? String(data.image) : undefined,
        html: marked.parse(content, { async: false }) as string,
      } satisfies Article;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  cache = list;
  return list;
}

export function getArticle(slug: string) {
  return getArticles().find((a) => a.slug === slug);
}

export function findByLegacySlug(slug: string) {
  return getArticles().find((a) => a.legacySlug === slug);
}

export function getTopics() {
  return Array.from(new Set(getArticles().map((a) => a.topic)));
}

export const topicSlug = (t: string) =>
  t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
