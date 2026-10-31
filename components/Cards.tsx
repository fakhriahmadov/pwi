import Link from "next/link";
import type { Article } from "@/lib/articles";
import type { SummitEvent } from "@/content/events";
import { longDate, dayOfMonth, monthYear, weekday } from "@/lib/format";

export function ArticleCard({ a }: { a: Article }) {
  return (
    <Link href={`/insights/${a.slug}`} className="stack" style={{ ["--g" as string]: "14px", textDecoration: "none" }}>
      {a.image ? <img src={a.image} alt="" style={{ aspectRatio: "4/3", objectFit: "cover" }} /> : <div className="ph">{a.topic}<span className="dot">.</span></div>}
      <div className="meta"><span className="topic">{a.topic}</span><span>{longDate(a.date)}</span>{a.read && <span>{a.read} read</span>}</div>
      <h3 className="h3">{a.title}</h3>
    </Link>
  );
}

export function EventCard({ e }: { e: SummitEvent }) {
  const style = { ["--acc" as string]: e.accent, ["--on-acc" as string]: e.onAccent };
  return (
    <article className="ev" style={style}>
      <div className="ev-top">
        <span className="ev-day">{dayOfMonth(e.date)}</span>
        <span className="stack" style={{ ["--g" as string]: "0" }}>
          <span style={{ fontFamily: "var(--display)", fontSize: 19, fontWeight: 500 }}>{monthYear(e.date)}</span>
          <span style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase" }}>{weekday(e.date)}</span>
        </span>
      </div>
      <div className="ev-body">
        <span className="kicker" style={{ color: "var(--muted)" }}>{e.series}</span>
        <h3 className="ev-city">{e.city}<span style={{ color: e.accent === "#F5C400" ? "#B38F00" : e.accent }}>.</span></h3>
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 19, fontWeight: 500 }}>{e.venue}</div>
          <div className="muted" style={{ fontSize: 13 }}>{e.address}</div>
        </div>
        <p style={{ color: "var(--ink)" }}>{e.description}</p>
        <div className="row" style={{ ["--g" as string]: "8px" }}>{e.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
        <div className="row" style={{ marginTop: "auto", paddingTop: 8, alignItems: "center" }}>
          <Link className="btn btn-dark" href={`/events/${e.slug}/register`}>Register →</Link>
          <Link className="more" href={`/events/${e.slug}`} style={{ alignSelf: "center" }}>Programme</Link>
        </div>
      </div>
    </article>
  );
}

export const shortDate = longDate;
