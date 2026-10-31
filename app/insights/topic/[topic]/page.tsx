import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getArticles, getTopics, topicSlug } from "@/lib/articles";
import { ArticleCard } from "@/components/Cards";

type P = { params: Promise<{ topic: string }> };
export function generateStaticParams() { return getTopics().map((t) => ({ topic: topicSlug(t) })); }
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const slug = (await params).topic;
  const t = getTopics().find((x) => topicSlug(x) === slug);
  return t ? { title: `${t} — Insights` } : {};
}

export default async function TopicPage({ params }: P) {
  const slug = (await params).topic;
  const topic = getTopics().find((t) => topicSlug(t) === slug);
  if (!topic) notFound();
  const list = getArticles().filter((a) => a.topic === topic);
  return (
    <>
      <section className="dark"><div className="wrap stack" style={{ ["--g" as string]: "16px" }}>
        <Link href="/insights" className="kicker" style={{ textDecoration: "none" }}>← All insights</Link>
        <h1 className="display-l">{topic}<span className="dot">.</span></h1>
        <p className="muted">{list.length} {list.length === 1 ? "article" : "articles"}</p>
      </div></section>
      <section><div className="wrap grid" style={{ ["--g" as string]: "40px 24px" }}>{list.map((a) => <ArticleCard key={a.slug} a={a} />)}</div></section>
    </>
  );
}
