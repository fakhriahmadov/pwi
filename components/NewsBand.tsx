"use client";
import Link from "next/link";
import { useState } from "react";
import { NewsIcon, NewsRow, dayLabel, type Card } from "./NewsRow";

type Props = { regions: { key: string; label: string }[]; byRegion: Record<string, Card[]>; today: string; todayShort: string };

/** Homepage "Today in private wealth": click a region title to see its latest stories, all in the same row layout. */
export function NewsBand({ regions, byRegion, today, todayShort }: Props) {
  const first = regions.find((r) => byRegion[r.key]?.length)?.key ?? regions[0].key;
  const [region, setRegion] = useState(first);
  const list = byRegion[region] ?? [];
  return (
    <section className="news-band" aria-labelledby="news-h">
      <div className="wrap stack" style={{ ["--g" as string]: "clamp(20px,3vw,32px)" }}>
        <div className="news-head">
          <div className="stack" style={{ ["--g" as string]: "8px" }}>
            <span className="label news-date"><NewsIcon name="calendar" size={14} /><span>Daily brief · <span className="news-d-long">{today}</span><span className="news-d-short">{todayShort}</span></span></span>
            <h2 id="news-h" className="h2">Today in private wealth<span className="dot">.</span></h2>
          </div>
          <Link href={`/news?region=${region}`} className="news-all news-all-top">All news <NewsIcon name="arrow" size={15} /></Link>
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
        <Link href={`/news?region=${region}`} className="news-all news-all-bottom">All news <NewsIcon name="arrow" size={15} /></Link>
      </div>
    </section>
  );
}
