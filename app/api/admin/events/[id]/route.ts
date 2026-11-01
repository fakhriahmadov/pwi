import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { fromForm, toForm } from "@/lib/event-schema";
import { events as fileEvents } from "@/content/events";
import { fail, ok } from "@/lib/http";

const refresh = (slug?: string) => { revalidatePath("/", "layout"); if (slug) revalidatePath(`/events/${slug}`); };

/** Actions: save (keep status), publish, unpublish, delete, import (copy a file event into the editor). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { action?: string; values?: Record<string, unknown>; slug?: string };
  try { body = await req.json(); } catch { return fail("The form could not be read."); }

  if (body.action === "import") {
    const f = fileEvents.find((e) => e.slug === body.slug);
    if (!f) return fail("Event not found.", 404);
    const row = await db.eventItem.upsert({ where: { slug: f.slug }, create: { slug: f.slug, status: "published", data: f as unknown as Prisma.InputJsonValue }, update: {} });
    return ok({ redirect: `/admin/events/${row.id}` });
  }

  const existing = id === "new" ? null : await db.eventItem.findUnique({ where: { id } });
  if (id !== "new" && !existing) return fail("This event no longer exists.", 404);

  if (body.action === "delete") {
    const regs = await db.registration.count({ where: { eventSlug: existing!.slug } });
    if (regs > 0) return fail(`This event has ${regs} registrations, so it can't be deleted. Unpublish it instead.`);
    await db.eventItem.delete({ where: { id } });
    refresh(existing!.slug);
    return ok({ redirect: "/admin/events?deleted=1" });
  }

  let event;
  try { event = fromForm(body.values ?? {}, existing?.slug); } catch (e) { return fail((e as Error).message); }
  if (!existing) {
    let slug = event.slug, n = 2;
    while (await db.eventItem.findUnique({ where: { slug } })) slug = `${event.slug}-${n++}`;
    event.slug = slug;
  }
  const status = body.action === "publish" ? "published" : body.action === "unpublish" ? "draft" : existing?.status ?? "draft";
  const data = event as unknown as Prisma.InputJsonValue;
  const row = existing
    ? await db.eventItem.update({ where: { id }, data: { data, status } })
    : await db.eventItem.create({ data: { slug: event.slug, data, status } });
  refresh(row.slug);
  const message = body.action === "publish" ? "Published. The event is live." : body.action === "unpublish" ? "Unpublished. The event is hidden from the site." : status === "published" ? "Saved. Changes are live." : "Saved as a draft.";
  return ok({ message, values: toForm(event), ...(existing ? {} : { redirect: `/admin/events/${row.id}?created=1` }) });
}
