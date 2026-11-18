"use client";
import Link from "next/link";
import { useState } from "react";

type Card = { id: string; slug: string; topic: string; title: string; takeaway: string | null; figure: string | null; sourceCount: number; eventDate: string };
type Props = { regions: { key: string; label: string }[]; byRegion: Record<string, Card[]>; today: string };

/** "Today", "Yesterday" or "12 Nov" for a story's date. */
export const dayLabel = (iso: string) => {
  const d = new Date(iso), t = new Date(), y = new Date(Date.now() - 864e5);
  const same = (a: Date, b: Date) => a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
  return same(d, t) ? "Today" : same(d, y) ? "Yesterday" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
};

/* Line icons (24px grid, currentColor). The theme icons are a visual cue only; the themes aren't named on the page. */
const P: Record<string, React.ReactNode> = {
  billionaires: <><path d="M6 3h12l3 6-9 12L3 9z" /><path d="M3 9h18M9 3l3 6 3-6M12 9v12" /></>,
  unicorns: <><path d="M5 19l2.5-2.5M14.5 4.5c2.5-1 4.5-1 5-.5s.5 2.5-.5 5L13 15.5 8.5 11z" /><path d="M8.5 11L5 10l3-4 4 .5M13 15.5l1 3.5 4-3-.5-4" /><circle cx="15.5" cy="8.5" r="1.5" /></>,
  bankruptcies: <><path d="M3 5l6 6 4-4 8 9" /><path d="M21 11v5h-5" /><path d="M3 21h18" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="1" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
};
export function NewsIcon({ name, size = 18 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[name] ?? P.billionaires}</svg>;
}
const CUE: Record<string, string> = { billionaires: "Fortunes", unicorns: "New companies", bankruptcies: "Failures" };

/** One news row: theme icon · key figure · headline and our takeaway · source and time. Shared by the homepage and /news. */
export function NewsRow({ n, when }: { n: Card; when: string }) {
  return (
    <li className={`news-row news-t-${n.topic}`}>
      <span className="news-cue" title={CUE[n.topic]}><NewsIcon name={n.topic} size={20} /></span>
      <span className="news-fig">{n.figure}</span>
      <span className="news-body">
        <Link className="news-title" href={`/news/${n.slug}`}>{n.title}<span className="news-out"><NewsIcon name="arrow" size={14} /></span></Link>
        {n.takeaway && <span className="news-take">{n.takeaway}</span>}
      </span>
      <span className="news-meta">{n.sourceCount > 0 && <span className="news-src">{n.sourceCount} {n.sourceCount === 1 ? "source" : "sources"}</span>}{when && <span className="news-when"><NewsIcon name="clock" size={13} />{when}</span>}</span>
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
            <span className="label news-date"><NewsIcon name="calendar" size={14} />Daily brief · {today}</span>
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
          {list.length ? <ol className="news-list">{list.map((n) => <NewsRow key={n.id} n={n} when={dayLabel(n.eventDate)} />)}</ol>
            : <p className="news-empty">No news from this region today.</p>}
        </div>
      </div>
    </section>
  );
}
