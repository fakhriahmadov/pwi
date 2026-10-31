import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const PAGES = ["imprint", "privacy", "cookies", "terms"];
const read = (p: string) => {
  if (!PAGES.includes(p)) return null;
  const { data, content } = matter(fs.readFileSync(path.join(process.cwd(), "content/legal", `${p}.md`), "utf8"));
  return { title: String(data.title), html: marked.parse(content, { async: false }) as string };
};
type P = { params: Promise<{ page: string }> };
export function generateStaticParams() { return PAGES.map((page) => ({ page })); }
export async function generateMetadata({ params }: P): Promise<Metadata> { const d = read((await params).page); return d ? { title: d.title } : {}; }

export default async function Legal({ params }: P) {
  const d = read((await params).page);
  if (!d) notFound();
  return (
    <section><div className="wrap stack" style={{ ["--g" as string]: "32px" }}>
      <h1 className="display-l">{d.title}<span className="dot">.</span></h1>
      <div className="prose" dangerouslySetInnerHTML={{ __html: d.html }} />
    </div></section>
  );
}
