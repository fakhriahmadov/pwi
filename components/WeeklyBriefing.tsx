"use client";
import Link from "next/link";
import { useState } from "react";
import { CUE, NewsIcon, Reads, dayLabel, type Card } from "./NewsRow";

type Props = { regions: { key: string; label: string }[]; byRegion: Record<string, Card[]>; range: string };

/** Homepage "Weekly briefing": the five most-read stories of the last seven days, per region. No. 1 is featured. */
export function WeeklyBriefing({ regions, byRegion, range }: Props) {
  const first = regions.find((r) => byRegion[r.key]?.length)?.key ?? regions[0].key;
  const [region, setRegion] = useState(first);
  const list = byRegion[region] ?? [];
  return (
    <section className="wk" aria-labelledby="wk-h">
      <div className="wrap stack" style={{ ["--g" as string]: "clamp(20px,3vw,32px)" }}>
        <div className="news-head">
          <div className="stack" style={{ ["--g" as string]: "8px" }}>
            <span className="label news-date"><NewsIcon name="calendar" size={14} /><span>Weekly briefing · {range}</span></span>
            <h2 id="wk-h" className="h2">Most read this week<span className="dot">.</span></h2>
            <p className="wk-sub">The five stories readers opened most in the last seven days, region by region.</p>
          </div>
        </div>
        <div className="news-tabs" role="tablist" aria-label="Region">
          {regions.map((r) => (
            <button key={r.key} type="button" role="tab" id={`wt-${r.key}`} aria-selected={region === r.key} aria-controls="wk-panel" onClick={() => setRegion(r.key)}>{r.label}</button>
          ))}
        </div>
        <div role="tabpanel" id="wk-panel" aria-labelledby={`wt-${region}`}>
          {list.length ? (
            <ol className="wk-list">
              {list.map((n, i) => (
                <li key={n.id} className={`wk-item news-t-${n.topic}${i === 0 ? " wk-top" : ""}`}>
                  <span className="wk-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <span className="wk-body">
                    <span className="wk-kick"><span>{CUE[n.topic]} · {dayLabel(n.eventDate)}</span><Reads n={n.reads} week /></span>
                    <Link className="wk-title" href={`/news/${n.slug}`}><span className="sr-only">Number {i + 1}: </span>{n.title}</Link>
                    {n.takeaway && <span className="wk-take">{n.takeaway}</span>}
                    {n.figure && i === 0 && <span className="wk-fig">{n.figure}</span>}
                  </span>
                </li>
              ))}
            </ol>
          ) : <p className="news-empty">No stories from this region this week.</p>}
        </div>
      </div>
    </section>
  );
}
