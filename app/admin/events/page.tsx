import Link from "next/link";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { events as fileEvents, type SummitEvent } from "@/content/events";
import { longDate } from "@/lib/format";
import { AdminNav } from "../AdminNav";
import { ImportButton } from "./ImportButton";

export const metadata: Metadata = { title: "Admin — Events", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminEvents({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const sp = await searchParams;
  if (!dbConfigured()) return <section className="admin"><div className="wrap"><p className="notice err">Set DATABASE_URL to manage events.</p></div></section>;
  const rows = await db.eventItem.findMany();
  const regs = await db.registration.groupBy({ by: ["eventSlug"], _count: true, where: { status: { not: "CANCELLED" } } });
  const count = (slug: string) => regs.find((r) => r.eventSlug === slug)?._count ?? 0;
  const managed = new Set(rows.map((r) => r.slug));
  const list = [
    ...rows.map((r) => ({ id: r.id, e: { ...(r.data as unknown as SummitEvent), slug: r.slug }, status: r.status, file: false })),
    ...fileEvents.filter((f) => !managed.has(f.slug)).map((f) => ({ id: "", e: f, status: "published", file: true })),
  ].sort((a, b) => b.e.date.localeCompare(a.e.date));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "24px", paddingTop: 40, maxWidth: 1100 }}>
        <div className="row between" style={{ alignItems: "center" }}>
          <h1 className="h2">Events<span className="dot">.</span></h1>
          <Link className="btn btn-red" href="/admin/events/new">New event</Link>
        </div>
        <AdminNav current="events" />
        {sp.deleted && <p className="notice okay" role="status">Event deleted.</p>}
        <div className="table-box" style={{ background: "var(--paper)" }}>
          <table className="table" style={{ fontSize: 14, minWidth: 760 }}>
            <thead><tr><th style={{ paddingLeft: 16 }}>Event</th><th>Date</th><th>Status</th><th>Registrations</th><th></th></tr></thead>
            <tbody>
              {list.map(({ id, e, status, file }) => (
                <tr key={e.slug}>
                  <td style={{ paddingLeft: 16 }}><b style={{ fontWeight: 500 }}>{e.series} {e.city}</b><br /><span className="muted">{e.venue}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>{longDate(e.date)}{e.date < today && <><br /><span className="muted">Past</span></>}</td>
                  <td><span className={`pill ${status === "published" ? "PAID" : "PENDING_APPROVAL"}`}>{status === "published" ? "Published" : "Draft"}</span></td>
                  <td>{count(e.slug) ? <Link href={`/admin?tab=registrations&event=${e.slug}`}>{count(e.slug)}</Link> : "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {file ? <ImportButton slug={e.slug} /> : <Link href={`/admin/events/${id}`}>Edit</Link>}
                    {status === "published" && <> · <a href={`/events/${e.slug}`} target="_blank">View ↗</a></>}
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="muted" style={{ paddingLeft: 16 }}>No events yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
