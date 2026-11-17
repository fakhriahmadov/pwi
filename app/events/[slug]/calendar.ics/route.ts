import { getEvent } from "@/lib/events";
import { site } from "@/content/site";
import { calendarTimes } from "@/lib/calendar";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const e = await getEvent((await params).slug);
  if (!e) return new Response("Not found", { status: 404 });
  const t = calendarTimes(e);
  const esc = (x: string) => x.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Private Wealth Institute//Events//EN", "BEGIN:VEVENT",
    `UID:${e.slug}@privatewealth.institute`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    ...(t.allDay ? [`DTSTART;VALUE=DATE:${t.start}`, `DTEND;VALUE=DATE:${t.end}`] : [`DTSTART;TZID=${t.tz}:${t.start}`, `DTEND;TZID=${t.tz}:${t.end}`]),
    `SUMMARY:${esc(`${e.series} ${e.city}`)}`, `LOCATION:${esc(`${e.venue}, ${e.address.replace(/\s*·\s*/g, ", ")}`)}`,
    `DESCRIPTION:${esc(e.description)}`, `URL:${site.url}/events/${e.slug}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${e.slug}.ics"` } });
}
