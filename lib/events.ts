import { events as fileEvents, type SummitEvent, type Pass } from "@/content/events";
import { db, dbConfigured } from "./db";
import { isPreview } from "./content";

const todayISO = () => new Date().toISOString().slice(0, 10);

/** All events: those managed in Admin → Events, plus file events not yet imported. Drafts only while previewing (or when asked). */
export async function allEvents(opts: { includeDrafts?: boolean } = {}): Promise<SummitEvent[]> {
  const bySlug = new Map<string, SummitEvent>(fileEvents.map((e) => [e.slug, e]));
  if (dbConfigured()) {
    try {
      const drafts = opts.includeDrafts || (await isPreview());
      const rows = await db.eventItem.findMany();
      for (const r of rows) {
        bySlug.delete(r.slug);
        if (r.status === "published" || drafts) bySlug.set(r.slug, { ...(r.data as unknown as SummitEvent), slug: r.slug });
      }
    } catch (e) { console.error("[events] database unavailable, using file events", e); }
  }
  return [...bySlug.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function upcomingEvents() { const t = todayISO(); return (await allEvents()).filter((e) => e.date >= t); }
export async function pastEvents() { const t = todayISO(); return (await allEvents()).filter((e) => e.date < t).reverse(); }
export async function getEvent(slug: string, opts: { includeDrafts?: boolean } = {}) { return (await allEvents(opts)).find((e) => e.slug === slug); }

export const getPass = (e: SummitEvent, id: string) => e.passes.find((p) => p.id === id);
export const isPast = (e: SummitEvent) => e.date < todayISO();

export function passPriceLabel(p: Pass) {
  if (p.onRequest) return "On request";
  if (p.priceCents == null) return "Price to be announced";
  return formatEuro(p.priceCents);
}

export function formatEuro(cents: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
}
