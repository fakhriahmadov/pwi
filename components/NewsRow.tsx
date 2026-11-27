import Link from "next/link";

/* Shared by the homepage section (client) and the news pages (server): no client-only code here. */
export type Card = { id: string; slug: string; topic: string; title: string; takeaway: string | null; figure: string | null; sourceCount: number; eventDate: string; reads?: number };

/** 1234 → "1.2k" */
export const fmtReads = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0).replace(/\.0$/, "")}m` : n >= 1e3 ? `${(n / 1e3).toFixed(n < 1e4 ? 1 : 0).replace(/\.0$/, "")}k` : String(n));

/** Small eye + number of reads; nothing until a story has been read. */
export function Reads({ n, week }: { n?: number; week?: boolean }) {
  if (!n) return null;
  const label = `${n.toLocaleString("en-GB")} ${n === 1 ? "read" : "reads"}${week ? " this week" : ""}`;
  return <span className="news-reads" title={label} aria-label={label}><NewsIcon name="eye" size={14} />{fmtReads(n)}</span>;
}

/** "Today", "Yesterday" or "12 Nov" for a story's date. */
export const dayLabel = (iso: string) => {
  const d = new Date(iso), t = new Date(), y = new Date(Date.now() - 864e5);
  const same = (a: Date, b: Date) => a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
  return same(d, t) ? "Today" : same(d, y) ? "Yesterday" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
};

/* Line icons (24px grid, currentColor). The theme icons are a visual cue only; the themes aren't named on the page. */
const P: Record<string, React.ReactNode> = {
  billionaires: <><path d="M9.5 3h5l-1.6 3.2h-1.8z" /><path d="M10 6.2h4" /><path d="M9.6 7.4C6 9.6 4.4 13.4 4.8 16.6c.3 2.6 2.4 4.4 5 4.4h4.4c2.6 0 4.7-1.8 5-4.4.4-3.2-1.2-7-4.8-9.2" /><path d="M14 11.6c-.4-.8-1.1-1.2-2-1.2-1.1 0-1.9.6-1.9 1.5 0 2 4 1.2 4 3.3 0 .9-.9 1.6-2.1 1.6-.9 0-1.7-.4-2.1-1.2M12 9.2v1.2M12 16.8v1.2" /></>,
  unicorns: <><path d="M5 19l2.5-2.5M14.5 4.5c2.5-1 4.5-1 5-.5s.5 2.5-.5 5L13 15.5 8.5 11z" /><path d="M8.5 11L5 10l3-4 4 .5M13 15.5l1 3.5 4-3-.5-4" /><circle cx="15.5" cy="8.5" r="1.5" /></>,
  bankruptcies: <><path d="M3 5l6 6 4-4 8 9" /><path d="M21 11v5h-5" /><path d="M3 21h18" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  sources: <><path d="M4 5h11v14H4z" /><path d="M15 8h5v11a2 2 0 0 1-2 2H6M7 9h5M7 12.5h5M7 16h3" /></>,
  linkedin: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" /></>,
  x: <path fill="currentColor" stroke="none" d="M17.75 3h3.07l-6.71 7.67L22 21h-6.18l-4.84-6.33L5.44 21H2.37l7.18-8.2L2 3h6.34l4.37 5.78L17.75 3zm-1.08 16.2h1.7L7.4 4.73H5.58L16.67 19.2z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M3.5 6l8.5 7 8.5-7" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="1" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
};
export function NewsIcon({ name, size = 18 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[name] ?? P.billionaires}</svg>;
}
export const CUE: Record<string, string> = { billionaires: "Fortunes", unicorns: "New companies", bankruptcies: "Failures" };

/** One news row: theme icon · key figure · headline and our takeaway · source and time. Shared by the homepage and /news. */
export function NewsRow({ n, when, whenIcon = "clock" }: { n: Card; when: string; whenIcon?: string }) {
  return (
    <li className={`news-row news-t-${n.topic}`}>
      <span className="news-cue" title={CUE[n.topic]}><NewsIcon name={n.topic} size={20} /></span>
      <span className="news-body">
        <span className="news-kick">{CUE[n.topic]}</span>
        <Link className="news-title" href={`/news/${n.slug}`}>{n.title}<span className="news-out"><NewsIcon name="arrow" size={14} /></span></Link>
        {n.takeaway && <span className="news-take">{n.takeaway}</span>}
      </span>
      <span className="news-side">
        {n.figure && <span className="news-fig">{n.figure}</span>}
        <span className="news-meta">{n.sourceCount > 0 && <span className="news-src">{n.sourceCount} {n.sourceCount === 1 ? "source" : "sources"}</span>}{when && <span className="news-when"><NewsIcon name={whenIcon} size={13} />{when}</span>}<Reads n={n.reads} /></span>
      </span>
    </li>
  );
}

