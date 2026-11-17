import type { SummitEvent } from "@/content/events";
import { site } from "@/content/site";

/** Start/end of an event for calendars: local times in the event's time zone when known, otherwise all-day. */
export function calendarTimes(e: SummitEvent) {
  const hm = (t?: string) => (t && /^\d{1,2}:\d{2}/.test(t) ? t.match(/^(\d{1,2}):(\d{2})/)!.slice(1).map((x) => x.padStart(2, "0")).join("") : null);
  const d = e.date.replace(/-/g, "");
  const start = hm(e.startTime), end = hm(e.endTime);
  const nextDay = new Date(Date.UTC(+e.date.slice(0, 4), +e.date.slice(5, 7) - 1, +e.date.slice(8, 10) + 1)).toISOString().slice(0, 10).replace(/-/g, "");
  return start
    ? { allDay: false as const, start: `${d}T${start}00`, end: `${d}T${end ?? String(Math.min(23, +start.slice(0, 2) + 8)).padStart(2, "0") + start.slice(2)}00`, tz: e.timezone || "Europe/Vienna" }
    : { allDay: true as const, start: d, end: nextDay, tz: e.timezone || "Europe/Vienna" };
}

export function googleCalendarUrl(e: SummitEvent) {
  const t = calendarTimes(e);
  const q = new URLSearchParams({
    action: "TEMPLATE", text: `${e.series} ${e.city}`, dates: `${t.start}/${t.end}`,
    details: `${e.description}\n\n${site.url}/events/${e.slug}`, location: `${e.venue}, ${e.address.replace(/\s*·\s*/g, ", ")}`,
  });
  if (!t.allDay) q.set("ctz", t.tz);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
