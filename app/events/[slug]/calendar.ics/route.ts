import { getEvent } from "@/lib/events";
import { site } from "@/content/site";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const e = getEvent((await params).slug);
  if (!e) return new Response("Not found", { status: 404 });
  const d = e.date.replace(/-/g, "");
  const next = new Date(Date.UTC(+e.date.slice(0, 4), +e.date.slice(5, 7) - 1, +e.date.slice(8, 10) + 1)).toISOString().slice(0, 10).replace(/-/g, "");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Private Wealth Institute//Events//EN", "BEGIN:VEVENT",
    `UID:${e.slug}@privatewealth.institute`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next}`,
    `SUMMARY:${e.series} ${e.city}`, `LOCATION:${e.venue}\\, ${e.address.replace(/·/g, ",")}`,
    `DESCRIPTION:${e.description.replace(/,/g, "\\,")}`, `URL:${site.url}/events/${e.slug}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${e.slug}.ics"` } });
}
