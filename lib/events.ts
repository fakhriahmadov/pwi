import { events, type SummitEvent, type Pass } from "@/content/events";

const todayISO = () => new Date().toISOString().slice(0, 10);

export function upcomingEvents(): SummitEvent[] {
  const t = todayISO();
  return events.filter((e) => e.date >= t).sort((a, b) => a.date.localeCompare(b.date));
}

export function pastEvents(): SummitEvent[] {
  const t = todayISO();
  return events.filter((e) => e.date < t).sort((a, b) => b.date.localeCompare(a.date));
}

export const getEvent = (slug: string) => events.find((e) => e.slug === slug);
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
