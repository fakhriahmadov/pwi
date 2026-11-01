import Link from "next/link";
import { db, dbConfigured } from "@/lib/db";
import { PAGES } from "@/lib/content-schema";
import { blockStatus } from "@/lib/content";
import { allEvents } from "@/lib/events";
import { AdminNav } from "./AdminNav";

/** Admin home: every section with what needs attention. */
export async function Overview() {
  if (!dbConfigured()) return <section className="admin"><div className="wrap"><p className="notice err">Set DATABASE_URL to use the admin area.</p></div></section>;
  const today = new Date().toISOString().slice(0, 10);
  const [blocks, drafts, published, indexes, reports, toReview, enquiries, subs, events] = await Promise.all([
    db.contentBlock.findMany(), db.article.count({ where: { status: "draft" } }), db.article.count({ where: { status: "published" } }),
    db.indexDef.count({ where: { published: true } }), db.report.count({ where: { status: "published" } }),
    db.registration.count({ where: { status: { in: ["PENDING_APPROVAL", "ENQUIRY"] } } }), db.enquiry.count({ where: { handled: false } }),
    db.subscriber.count({ where: { confirmedAt: { not: null }, unsubscribed: false } }), allEvents({ includeDrafts: true }),
  ]);
  const changed = blocks.filter((b) => blockStatus(b) === "changes").map((b) => PAGES.find((p) => p.key === b.key)?.label ?? b.key);
  const upcoming = events.filter((e) => e.date >= today);
  const cards: { href: string; title: string; big: string; text: string; alert?: boolean }[] = [
    { href: "/admin/pages", title: "Pages", big: changed.length ? String(changed.length) : "✓", text: changed.length ? `Unpublished changes: ${changed.join(", ")}` : "Everything published", alert: changed.length > 0 },
    { href: "/admin/insights", title: "Insights", big: String(published), text: `published article${published === 1 ? "" : "s"}${drafts ? ` · ${drafts} draft${drafts > 1 ? "s" : ""}` : ""}`, alert: drafts > 0 },
    { href: "/admin/research", title: "Indexes", big: String(indexes), text: indexes === 1 ? "published index" : "published indexes" },
    { href: "/admin/events", title: "Events", big: String(upcoming.length), text: upcoming[0] ? `upcoming · next: ${upcoming[0].city}, ${upcoming[0].date}` : "upcoming" },
    { href: "/admin/reports", title: "Reports", big: String(reports), text: reports === 1 ? "published report" : "published reports" },
    { href: "/admin?tab=registrations", title: "Registrations", big: String(toReview), text: "waiting for review", alert: toReview > 0 },
    { href: "/admin?tab=enquiries", title: "Enquiries", big: String(enquiries), text: "open enquiries", alert: enquiries > 0 },
    { href: "/admin?tab=subscribers", title: "Subscribers", big: String(subs), text: "confirmed newsletter subscribers" },
  ];
  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "24px", paddingTop: 40, maxWidth: 1100 }}>
        <h1 className="h2">Admin<span className="dot">.</span></h1>
        <AdminNav current="home" />
        <div className="grid" style={{ ["--min" as string]: "230px", ["--g" as string]: "12px" }}>
          {cards.map((c) => (
            <Link key={c.title} href={c.href} className="stack" style={{ background: "var(--paper)", padding: 22, textDecoration: "none", borderTop: `3px solid ${c.alert ? "var(--red)" : "var(--ink)"}`, ["--g" as string]: "6px" }}>
              <span className="label-s muted">{c.title}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 300, lineHeight: 1, color: c.alert ? "var(--red)" : "var(--ink)" }}>{c.big}</span>
              <span style={{ fontSize: 13, color: "var(--ink-body)" }}>{c.text}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
