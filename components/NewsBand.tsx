"use client";
import Link from "next/link";
import { useState } from "react";

type Card = { id: string; topic: string; title: string; takeaway: string | null; figure: string | null; source: string | null; url: string; publishedAt: string };
type Props = { regions: { key: string; label: string }[]; topics: { key: string; label: string }[]; byRegion: Record<string, Record<string, Card[]>>; today: string };

const ICON: Record<string, React.ReactNode> = {
  billionaires: <><path d="M3 18l2-10 5 4 2-7 2 7 5-4 2 10z" /><path d="M3 21h18" /></>,
  unicorns: <><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" /></>,
  bankruptcies: <><path d="M3 6l6 6 4-4 8 8" /><path d="M21 11v5h-5" /></>,
};
const ago = (iso: string) => { const h = Math.round((Date.now() - Date.parse(iso)) / 36e5); return h < 1 ? "Just now" : h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`; };

/** Homepage "Today in private wealth": click a region title to see its billionaires, new unicorns and bankruptcies. */
export function NewsBand({ regions, topics, byRegion, today }: Props) {
  const first = regions.find((r) => topics.some((t) => byRegion[r.key]?.[t.key]?.length))?.key ?? regions[0].key;
  const [region, setRegion] = useState(first);
  const cur = byRegion[region] ?? {};
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
        <div className="news-cols" role="tabpanel" id="news-panel" aria-labelledby={`nt-${region}`}>
          {topics.map((t) => {
            const list = cur[t.key] ?? [];
            return (
              <div key={t.key} className={`news-col news-${t.key}`}>
                <h3 className="news-topic">
                  <span className="news-ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICON[t.key]}</svg></span>
                  {t.label}
                </h3>
                {list.length ? (
                  <ol className="news-list">
                    {list.map((n) => (
                      <li key={n.id}>
                        {n.figure && <span className="news-fig">{n.figure}</span>}
                        <a className="news-title" href={n.url} target="_blank" rel="noopener">{n.title}</a>
                        {n.takeaway && <p className="news-take">{n.takeaway}</p>}
                        <span className="news-meta">{n.source ? `${n.source} · ` : ""}{ago(n.publishedAt)}</span>
                      </li>
                    ))}
                  </ol>
                ) : <p className="news-empty">No headlines today.</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
