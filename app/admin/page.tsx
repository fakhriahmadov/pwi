import Link from "next/link";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { allEvents } from "@/lib/events";
import { formatEuro } from "@/lib/events";
import { AdminNav } from "./AdminNav";
import { Overview } from "./Overview";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

type SP = Promise<{ tab?: string; event?: string; done?: string }>;
const dt = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");

export default async function Admin({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  if (!sp.tab) return <Overview />;
  const tab = sp.tab;
  if (!dbConfigured()) return <section className="admin"><div className="wrap"><p className="notice err">Set DATABASE_URL and run <code>npm run db:push</code> to use the admin area.</p></div></section>;

  const events = await allEvents({ includeDrafts: true });
  const eventSlug = sp.event || events[0]?.slug;
  const [regs, enquiries, subs, counts] = await Promise.all([
    tab === "registrations" ? db.registration.findMany({ where: { eventSlug }, orderBy: { createdAt: "desc" }, take: 500 }) : Promise.resolve([]),
    tab === "enquiries" ? db.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 500 }) : Promise.resolve([]),
    tab === "subscribers" ? db.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 1000 }) : Promise.resolve([]),
    Promise.all([
      db.registration.count({ where: { eventSlug, status: "PAID" } }),
      db.registration.aggregate({ where: { eventSlug, status: "PAID" }, _sum: { amountCents: true, quantity: true } }),
      db.registration.count({ where: { eventSlug, status: { in: ["PENDING_APPROVAL", "ENQUIRY"] } } }),
      db.enquiry.count({ where: { handled: false } }),
      db.subscriber.count({ where: { confirmedAt: { not: null }, unsubscribed: false } }),
    ]),
  ]);
  const [paidCount, paidSum, toReview, openEnq, subCount] = counts;

  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "24px", paddingTop: 40 }}>
        <div className="row between"><h1 className="h2">Admin<span className="dot">.</span></h1>{sp.done && <span className="notice okay" role="status">Saved.</span>}</div>
        <AdminNav current={tab} labels={{ enquiries: `Enquiries (${openEnq} open)`, subscribers: `Subscribers (${subCount})` }} />

        {tab === "registrations" && (
          <>
            <div className="row" style={{ ["--g" as string]: "8px" }}>
              {events.map((e) => <Link key={e.slug} className="chip" aria-current={eventSlug === e.slug ? "page" : undefined} href={`/admin?tab=registrations&event=${e.slug}`}>{e.city} {e.date.slice(0, 4)}</Link>)}
            </div>
            <div className="grid" style={{ ["--min" as string]: "200px" }}>
              <div className="fact" style={{ borderColor: "var(--line)" }}><span className="label">Paid registrations</span><span className="fact-big">{paidCount}</span></div>
              <div className="fact" style={{ borderColor: "var(--line)" }}><span className="label">Guests</span><span className="fact-big">{paidSum._sum.quantity ?? 0}</span></div>
              <div className="fact" style={{ borderColor: "var(--line)" }}><span className="label">Revenue</span><span className="fact-big">{formatEuro(paidSum._sum.amountCents ?? 0)}</span></div>
              <div className="fact" style={{ borderColor: "var(--line)" }}><span className="label">To review</span><span className="fact-big">{toReview}</span></div>
            </div>
            <a className="more" href={`/api/admin/export?type=registrations&event=${eventSlug}`}>Export CSV (check-in list) →</a>
            <div className="table-box" style={{ background: "var(--white)" }}>
              <table className="table" style={{ fontSize: 14, minWidth: 980 }}>
                <thead><tr><th>Date</th><th>Name</th><th>Company</th><th>Pass</th><th>Status</th><th>Ticket</th><th>Actions</th></tr></thead>
                <tbody>
                  {regs.map((r) => (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{dt(r.createdAt)}</td>
                      <td><b style={{ fontWeight: 500 }}>{r.firstName} {r.lastName}</b><br /><span className="muted">{r.email}</span></td>
                      <td>{r.company}{r.role ? <><br /><span className="muted">{r.role}</span></> : null}</td>
                      <td>{r.passName} × {r.quantity}{r.amountCents ? <><br /><span className="muted">{formatEuro(r.amountCents)}</span></> : null}</td>
                      <td><span className={`pill ${r.status}`}>{r.status.replace("_", " ").toLowerCase()}</span>{r.checkedInAt && <><br /><span className="muted">in {dt(r.checkedInAt)}</span></>}</td>
                      <td>{r.ticketCode ? <a href={`/tickets/${r.ticketCode}`}>{r.ticketCode}</a> : "—"}</td>
                      <td>
                        <form method="post" action={`/api/admin/registrations/${r.id}`} className="row" style={{ ["--g" as string]: "6px" }}>
                          {(r.status === "PENDING_APPROVAL" || r.status === "ENQUIRY") && <button className="chip" name="action" value="approve">Approve</button>}
                          {r.status === "PAID" && !r.checkedInAt && <button className="chip" name="action" value="checkin">Check in</button>}
                          {r.status === "PAID" && <button className="chip" name="action" value="resend">Resend ticket</button>}
                          {r.status !== "CANCELLED" && r.status !== "PAID" && <button className="chip" name="action" value="cancel">Cancel</button>}
                        </form>
                      </td>
                    </tr>
                  ))}
                  {regs.length === 0 && <tr><td colSpan={7} className="muted">No registrations yet.</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ fontSize: 13 }}>Refunds are made in the Stripe dashboard. Approving a priced pass emails the guest a payment link; approving an “on request” pass marks it confirmed without payment and issues a ticket.</p>
          </>
        )}

        {tab === "enquiries" && (
          <>
            <a className="more" href="/api/admin/export?type=enquiries">Export CSV →</a>
            <div className="table-box" style={{ background: "var(--white)" }}>
              <table className="table" style={{ fontSize: 14, minWidth: 900 }}>
                <thead><tr><th>Date</th><th>Topic</th><th>From</th><th>Message</th><th></th></tr></thead>
                <tbody>
                  {enquiries.map((q) => (
                    <tr key={q.id} style={{ opacity: q.handled ? .55 : 1 }}>
                      <td style={{ whiteSpace: "nowrap" }}>{dt(q.createdAt)}</td><td><span className="pill">{q.topic}</span></td>
                      <td><b style={{ fontWeight: 500 }}>{q.name}</b><br /><a href={`mailto:${q.email}`}>{q.email}</a>{q.company && <><br /><span className="muted">{q.company}</span></>}</td>
                      <td style={{ maxWidth: 420, whiteSpace: "pre-wrap" }}>{q.message}</td>
                      <td>{!q.handled && <form method="post" action={`/api/admin/registrations/${q.id}`}><button className="chip" name="action" value="enquiry-done">Mark handled</button></form>}</td>
                    </tr>
                  ))}
                  {enquiries.length === 0 && <tr><td colSpan={5} className="muted">No enquiries yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "subscribers" && (
          <>
            <a className="more" href="/api/admin/export?type=subscribers">Export confirmed subscribers (CSV) →</a>
            <div className="table-box" style={{ background: "var(--white)" }}>
              <table className="table" style={{ fontSize: 14 }}>
                <thead><tr><th>Email</th><th>Source</th><th>Signed up</th><th>Status</th></tr></thead>
                <tbody>
                  {subs.map((s) => <tr key={s.id}><td>{s.email}</td><td>{s.source}</td><td>{dt(s.createdAt)}</td><td><span className="pill">{s.unsubscribed ? "unsubscribed" : s.confirmedAt ? "confirmed" : "awaiting confirmation"}</span></td></tr>)}
                  {subs.length === 0 && <tr><td colSpan={4} className="muted">No subscribers yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
