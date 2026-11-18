"use client";
import Link from "next/link";
import { useState } from "react";

type Card = { id: string; title: string; takeaway: string | null; figure: string | null; source: string | null; url: string; publishedAt: string };
type Props = { regions: { key: string; label: string }[]; byRegion: Record<string, Card[]>; today: string };

export const ago = (iso: string) => { const h = Math.round((Date.now() - Date.parse(iso)) / 36e5); return h < 1 ? "Just now" : h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`; };

/** One news row: key figure · headline and our takeaway · source and time. Shared by the homepage and /news. */
export function NewsRow({ n, when }: { n: Card; when: string }) {
  return (
    <li className="news-row">
      <span className="news-fig">{n.figure}</span>
      <span className="news-body">
        <a className="news-title" href={n.url} target="_blank" rel="noopener">{n.title}</a>
        {n.takeaway && <span className="news-take">{n.takeaway}</span>}
      </span>
      <span className="news-meta">{n.source && <span>{n.source}</span>}<span>{when}</span></span>
    </li>
  );
}

/** Homepage "Today in private wealth": click a region title to see its latest news, one plain list. */
export function NewsBand({ regions, byRegion, today }: Props) {
  const first = regions.find((r) => byRegion[r.key]?.length)?.key ?? regions[0].key;
  const [region, setRegion] = useState(first);
  const list = byRegion[region] ?? [];
  return (
    <section className="news-band" aria-labelledby="news-h">
      <div className="wrap stack" style={{ ["--g" as string]: "28px" }}>
        <div className="news-head">
          <div className="stack" style={{ ["--g" as string]: "8px" }}>
            <span className="label">Daily brief · {today}</span>
            <h2 id="news-h" className="h2">Today in private wealth<span className="dot">.</span></h2>
          </div>
          <Link href={`/news?region=${region}`} className="news-all">All news →</Link>
        </div>
        <div className="news-tabs" role="tablist" aria-label="Region">
          {regions.map((r) => (
            <button key={r.key} type="button" role="tab" id={`nt-${r.key}`} aria-selected={region === r.key} aria-controls="news-panel" onClick={() => setRegion(r.key)}>{r.label}</button>
          ))}
        </div>
        <div role="tabpanel" id="news-panel" aria-labelledby={`nt-${region}`}>
          {list.length ? <ol className="news-list">{list.map((n) => <NewsRow key={n.id} n={n} when={ago(n.publishedAt)} />)}</ol>
            : <p className="news-empty">No news from this region today.</p>}
        </div>
      </div>
    </section>
  );
}
