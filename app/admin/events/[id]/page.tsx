import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { EVENT_SECTIONS, toForm } from "@/lib/event-schema";
import type { SummitEvent } from "@/content/events";
import { AdminNav } from "../../AdminNav";
import { SchemaForm } from "@/components/admin/SchemaForm";

export const metadata: Metadata = { title: "Admin — Edit event", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params; const sp = await searchParams;
  if (!dbConfigured()) notFound();
  const row = id === "new" ? null : await db.eventItem.findUnique({ where: { id } });
  if (id !== "new" && !row) notFound();
  const e = row ? ({ ...(row.data as unknown as SummitEvent), slug: row.slug }) : null;
  const published = row?.status === "published";
  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "20px", paddingTop: 40, maxWidth: 1000 }}>
        <div className="stack" style={{ ["--g" as string]: "6px" }}>
          <Link href="/admin/events" className="muted" style={{ fontSize: 13 }}>← All events</Link>
          <h1 className="h2">{e ? `${e.series} ${e.city}` : "New event"}<span className="dot">.</span></h1>
          {e && <p className="muted">/events/{e.slug}{published && <> · <a href={`/events/${e.slug}`} target="_blank">View live page ↗</a></>}</p>}
        </div>
        <AdminNav current="events" />
        {sp.created && <p className="notice okay" role="status">Event created as a draft. Add the details, then publish.</p>}
        <SchemaForm sections={EVENT_SECTIONS} initial={toForm(e ?? {})} endpoint={`/api/admin/events/${id}`} previewPath={e ? `/events/${e.slug}` : undefined}
          status={row ? <span className={`pill ${published ? "PAID" : "PENDING_APPROVAL"}`}>{published ? "Published" : "Draft"}</span> : <span className="pill">New</span>}
          buttons={[
            ...(row ? [{ action: "delete", label: "Delete", variant: "quiet" as const, confirm: "Delete this event for good?" }] : []),
            ...(published ? [{ action: "unpublish", label: "Unpublish", variant: "quiet" as const, confirm: "Hide this event from the site?" }] : []),
            { action: "save", label: published ? "Save changes" : "Save draft", variant: published ? "secondary" : "quiet" },
            ...(!published ? [{ action: "publish", label: "Publish", variant: "primary" as const }] : []),
          ]} />
      </div>
    </section>
  );
}
