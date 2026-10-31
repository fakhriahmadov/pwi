"use client";
import Link from "next/link";
import { useState } from "react";
import type { Article } from "@/lib/articles";
import { longDate } from "@/lib/format";

type Item = Omit<Article, "html">;

export function InsightsList({ items, topics }: { items: Item[]; topics: string[] }) {
  const [topic, setTopic] = useState("All");
  const [featured, ...rest] = items;
  const shown = topic === "All" ? rest : items.filter((a) => a.topic === topic);
  return (
    <section>
      <div className="wrap stack" style={{ ["--g" as string]: "24px" }}>
        {featured && (
          <>
            <span className="kicker">Featured</span>
            <article className="paper grid" style={{ padding: "clamp(28px,4vw,56px)", ["--min" as string]: "300px", ["--g" as string]: "20px 80px", alignItems: "end" }}>
              <div className="stack" style={{ ["--g" as string]: "16px" }}>
                <div className="meta"><span className="topic">{featured.topic}</span><span>{featured.author}</span>{featured.read && <span>{featured.read} read</span>}</div>
                <h2 style={{ fontSize: "clamp(26px,6vw,56px)", lineHeight: 1.05, letterSpacing: "-.03em" }}>
                  <Link href={`/insights/${featured.slug}`} style={{ textDecoration: "none" }}>{featured.title}</Link>
                </h2>
              </div>
              <div className="stack" style={{ ["--g" as string]: "16px" }}>
                <p style={{ color: "var(--ink)", fontSize: 16 }}>{featured.excerpt}</p>
                <Link className="more" href={`/insights/${featured.slug}`}>Read article →</Link>
              </div>
            </article>
          </>
        )}
        <div className="row between" style={{ marginTop: "clamp(40px,6vw,80px)" }}>
          <div className="stack" style={{ ["--g" as string]: "8px" }}><span className="kicker">Archive</span><h2 className="h2" style={{ fontSize: "clamp(26px,2.8vw,36px)" }}>More articles</h2></div>
          <div className="row" role="group" aria-label="Filter by topic" style={{ ["--g" as string]: "8px" }}>
            {["All", ...topics].map((t) => (
              <button key={t} type="button" className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>{t}</button>
            ))}
          </div>
        </div>
        <ol className="rows">
          {shown.map((a) => (
            <li key={a.slug}>
              <span style={{ fontFamily: "var(--display)", fontWeight: 500 }}>{longDate(a.date)}</span>
              <div className="stack" style={{ ["--g" as string]: "12px" }}>
                <div className="meta"><span className="topic">{a.topic}</span><span>{a.author}</span>{a.read && <span>{a.read} read</span>}</div>
                <h3 className="h3" style={{ fontSize: "clamp(22px,2vw,28px)" }}><Link href={`/insights/${a.slug}`} style={{ textDecoration: "none" }}>{a.title}</Link></h3>
                <p style={{ color: "var(--ink)", maxWidth: "60ch" }}>{a.excerpt}</p>
                <Link className="more" href={`/insights/${a.slug}`}>Read article →</Link>
              </div>
            </li>
          ))}
        </ol>
        {shown.length === 0 && <p className="muted">No articles in this topic yet.</p>}
      </div>
    </section>
  );
}
