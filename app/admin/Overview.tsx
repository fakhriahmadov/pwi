import Link from "next/link";
import { db, dbConfigured } from "@/lib/db";
import { PAGES } from "@/lib/content-schema";
import { blockStatus } from "@/lib/content";
import { allEvents } from "@/lib/events";
import { AdminNav, AdminIcon } from "./AdminNav";
import { FREQUENCIES, buildDraft } from "@/lib/newsletter";

/** Admin home: every section with what needs attention. */
export async function Overview() {
  if (!dbConfigured()) return <section className="admin"><div className="wrap"><p className="notice err">Set DATABASE_URL to use the admin area.</p></div></section>;
  const today = new Date().toISOString().slice(0, 10);
  const [blocks, drafts, published, indexes, reports, toReview, enquiries, subs, events, members] = await Promise.all([
    db.contentBlock.findMany(), db.article.count({ where: { status: "draft" } }), db.article.count({ where: { status: "published" } }),
    db.indexDef.count({ where: { published: true } }), db.report.count({ where: { status: "published" } }),
    db.registration.count({ where: { OR: [{ status: { in: ["PENDING_APPROVAL", "ENQUIRY"] } }, { requestType: { not: null } }] } }), db.enquiry.count({ where: { handled: false } }),
    db.subscriber.count({ where: { confirmedAt: { not: null }, unsubscribed: false } }), allEvents({ includeDrafts: true }), db.member.count(),
  ]);
  const newsDrafts = await db.newsStory.count({ where: { status: "draft" } }).catch(() => 0);
  const nlWaiting = (await Promise.all(FREQUENCIES.map((f) => buildDraft(f.id).catch(() => null)))).filter((d) => d && d.status === "draft" && d.items.length && d.recipients).length;
  const changed = blocks.filter((b) => blockStatus(b) === "changes").map((b) => PAGES.find((p) => p.key === b.key)?.label ?? b.key);
  const upcoming = events.filter((e) => e.date >= today);
  const ICON: Record<string, string> = { Pages: "page", Insights: "pen", Indexes: "chart", Events: "calendar", Reports: "file", Registrations: "ticket", Accounts: "key", Enquiries: "inbox", Subscribers: "users", Newsletter: "mail", News: "news" };
  const cards: { href: string; title: string; big: string; text: string; alert?: boolean }[] = [
    { href: "/admin/pages", title: "Pages", big: changed.length ? String(changed.length) : "✓", text: changed.length ? `Unpublished changes: ${changed.join(", ")}` : "Everything published", alert: changed.length > 0 },
    { href: "/admin/insights", title: "Insights", big: String(published), text: `published article${published === 1 ? "" : "s"}${drafts ? ` · ${drafts} draft${drafts > 1 ? "s" : ""}` : ""}`, alert: drafts > 0 },
    { href: "/admin/news", title: "News", big: String(newsDrafts), text: newsDrafts === 1 ? "story waiting for review" : "stories waiting for review", alert: newsDrafts > 0 },
    { href: "/admin/research", title: "Indexes", big: String(indexes), text: indexes === 1 ? "published index" : "published indexes" },
    { href: "/admin/events", title: "Events", big: String(upcoming.length), text: upcoming[0] ? `upcoming · next: ${upcoming[0].city}, ${upcoming[0].date}` : "upcoming" },
    { href: "/admin/reports", title: "Reports", big: String(reports), text: reports === 1 ? "published report" : "published reports" },
    { href: "/admin?tab=registrations", title: "Registrations", big: String(toReview), text: "waiting for review (incl. cancellation and transfer requests)", alert: toReview > 0 },
    { href: "/admin?tab=accounts", title: "Accounts", big: String(members), text: "people with an account · roles and access" },
    { href: "/admin?tab=enquiries", title: "Enquiries", big: String(enquiries), text: "open enquiries", alert: enquiries > 0 },
    { href: "/admin?tab=subscribers", title: "Subscribers", big: String(subs), text: "confirmed newsletter subscribers" },
    { href: "/admin/newsletter", title: "Newsletter", big: String(nlWaiting), text: nlWaiting === 1 ? "edition waiting for your approval" : "editions waiting for your approval", alert: nlWaiting > 0 },
  ];
  const hour = new Date().getUTCHours() + 4;
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const waiting = cards.filter((c) => c.alert);
  const Card = (c: (typeof cards)[number]) => (
    <Link key={c.title} href={c.href} className={`adm-card${c.alert ? " alert" : ""}`}>
      <span className="adm-card-top"><span className="adm-card-ic"><AdminIcon name={ICON[c.title] ?? "page"} size={19} /></span>{c.alert ? <span className="adm-flag">Needs attention</span> : <span className="adm-card-go"><AdminIcon name="arrow" size={16} /></span>}</span>
      <span className="adm-card-t">{c.title}</span>
      <span className="adm-card-big">{c.big}</span>
      <span className="adm-card-x">{c.text}</span>
    </Link>
  );
  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "22px" }}>
        <div className="stack" style={{ ["--g" as string]: "6px" }}>
          <h1 className="h2">{greet}<span className="dot">.</span></h1>
          <p className="muted">{waiting.length ? `${waiting.length} ${waiting.length === 1 ? "area needs" : "areas need"} your attention today.` : "Everything is up to date."}</p>
        </div>
        <AdminNav current="home" />
        {waiting.length > 0 && <><span className="adm-sec">Needs attention</span><div className="adm-cards">{waiting.map(Card)}</div></>}
        <span className="adm-sec">{waiting.length ? "Everything else" : "At a glance"}</span>
        <div className="adm-cards">{cards.filter((c) => !c.alert).map(Card)}</div>
      </div>
    </section>
  );
}
