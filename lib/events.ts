import { events as fileEvents, type SummitEvent, type Pass } from "@/content/events";
import { db, dbConfigured } from "./db";
import { isPreview } from "./content";

const todayISO = () => new Date().toISOString().slice(0, 10);

const empty = (v: unknown) => v == null || v === "" || (Array.isArray(v) && v.length === 0);
/**
 * Copies saved before the redesign (no `v`) lack the newer fields: fill them from the event file, and replace the
 * old default colours (red/sand/black) with the file's event colour. Anything an admin filled in is kept.
 */
function withFileDefaults(e: SummitEvent): SummitEvent {
  const f = fileEvents.find((x) => x.slug === e.slug);
  if (!f || (e.v ?? 0) >= 2) return e;
  const out = { ...e } as Record<string, unknown>;
  for (const [k, v] of Object.entries(f)) if (empty(out[k])) out[k] = v;
  if (["#C42F33", "#EFE7DA", "#0A0A0A"].includes(String(e.accent).toUpperCase())) { out.accent = f.accent; out.onAccent = f.onAccent; }
  // Older saved copies were placeholders made by "Make editable": the file's content is the approved event content.
  for (const k of ["programme", "speakers", "themes", "tagline", "description", "tags", "photo", "cardPhoto", "venueDesc", "cityGuide", "mapsUrl", "eveningTime", "eveningTitle", "eveningLocation", "regText", "previous", "partners", "startTime", "endTime"] as const)
    if (f[k] !== undefined) out[k] = f[k];
  if ((e.passes ?? []).every((p) => p.priceCents == null) && f.passes.some((p) => p.priceCents != null)) out.passes = f.passes;
  if (e.registration === "checkout" && f.registration !== "checkout") out.registration = f.registration;
  if (empty(e.faq)) out.faq = f.faq;
  return out as SummitEvent;
}

/** All events: those managed in Admin → Events, plus file events not yet imported. Drafts only while previewing (or when asked). */
export async function allEvents(opts: { includeDrafts?: boolean } = {}): Promise<SummitEvent[]> {
  const bySlug = new Map<string, SummitEvent>(fileEvents.map((e) => [e.slug, e]));
  if (dbConfigured()) {
    try {
      const drafts = opts.includeDrafts || (await isPreview());
      const rows = await db.eventItem.findMany();
      for (const r of rows) {
        bySlug.delete(r.slug);
        if (r.status === "published" || drafts) bySlug.set(r.slug, withFileDefaults({ ...(r.data as unknown as SummitEvent), slug: r.slug }));
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
