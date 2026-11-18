"use client";
import Link from "next/link";
import { useState } from "react";
import { NewsIcon, NewsRow, dayLabel, CUE, type Card } from "./NewsRow";

type Props = { regions: { key: string; label: string }[]; byRegion: Record<string, Card[]>; today: string };

/** The featured story at the top of a region: large figure, headline, takeaway and a link to read it. */
function NewsLead({ n }: { n: Card }) {
  return (
    <article className={`news-lead news-t-${n.topic}`}>
      <div className="news-lead-top">
        <span className="news-cue" title={CUE[n.topic]}><NewsIcon name={n.topic} size={20} /></span>
        <span className="news-lead-meta"><NewsIcon name="clock" size={13} />{dayLabel(n.eventDate)}{n.sourceCount > 0 && <> · {n.sourceCount} {n.sourceCount === 1 ? "source" : "sources"}</>}</span>
      </div>
      {n.figure && <span className="news-lead-fig">{n.figure}</span>}
      <h3 className="news-lead-title"><Link href={`/news/${n.slug}`}>{n.title}</Link></h3>
      {n.takeaway && <p className="news-lead-take">{n.takeaway}</p>}
      <Link href={`/news/${n.slug}`} className="news-lead-more" aria-hidden="true" tabIndex={-1}>Read the story <NewsIcon name="arrow" size={15} /></Link>
    </article>
  );
}

/** Homepage "Today in private wealth": click a region title; its latest story is featured, the rest listed beside it. */
export function NewsBand({ regions, byRegion, today }: Props) {
  const first = regions.find((r) => byRegion[r.key]?.length)?.key ?? regions[0].key;
  const [region, setRegion] = useState(first);
  const list = byRegion[region] ?? [];
  const [lead, ...rest] = list;
  return (
    <section className="news-band" aria-labelledby="news-h">
      <div className="wrap stack" style={{ ["--g" as string]: "clamp(20px,3vw,32px)" }}>
        <div className="news-head">
          <div className="stack" style={{ ["--g" as string]: "8px" }}>
            <span className="label news-date"><NewsIcon name="calendar" size={14} />Daily brief · {today}</span>
            <h2 id="news-h" className="h2">Today in private wealth<span className="dot">.</span></h2>
          </div>
          <Link href={`/news?region=${region}`} className="news-all">All news <NewsIcon name="arrow" size={15} /></Link>
        </div>
        <div className="news-tabs" role="tablist" aria-label="Region">
          {regions.map((r) => {
            const c = byRegion[r.key]?.length ?? 0;
            return <button key={r.key} type="button" role="tab" id={`nt-${r.key}`} aria-selected={region === r.key} aria-controls="news-panel" onClick={() => setRegion(r.key)}>{r.label}{c > 0 && <span className="news-count">{c}</span>}</button>;
          })}
        </div>
        <div role="tabpanel" id="news-panel" aria-labelledby={`nt-${region}`}>
          {lead ? (
            <div className={`news-grid${rest.length ? "" : " news-grid-solo"}`}>
              <NewsLead n={lead} />
              {rest.length > 0 && <ol className="news-list news-compact">{rest.map((n) => <NewsRow key={n.id} n={n} when={dayLabel(n.eventDate)} />)}</ol>}
            </div>
          ) : <p className="news-empty">No news from this region today.</p>}
        </div>
      </div>
    </section>
  );
}
