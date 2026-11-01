import type { SummitEvent, Pass } from "@/content/events";
import type { Section, Values } from "./fields";
import { slugify } from "./markdown";

export const ACCENTS = [
  { value: "red", label: "Brand red", accent: "#C42F33", on: "#FFFFFF" },
  { value: "black", label: "Black", accent: "#0A0A0A", on: "#FFFFFF" },
  { value: "sand", label: "Sand", accent: "#EFE7DA", on: "#0A0A0A" },
];

export const EVENT_SECTIONS: Section[] = [
  { title: "Basics", fields: [
    { key: "series", label: "Series", type: "text", placeholder: "Future. Summit" },
    { key: "city", label: "City", type: "text", help: "Shown large on the event page." },
    { key: "date", label: "Date", type: "date" },
    { key: "startTime", label: "Start time (optional)", type: "time" },
    { key: "timezone", label: "Time zone", type: "select", options: ["Europe/Vienna", "Europe/Madrid", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Zurich", "Asia/Dubai", "America/New_York"].map((z) => ({ value: z, label: z })) },
    { key: "description", label: "Description", type: "textarea" },
    { key: "tags", label: "Highlights", type: "tags", placeholder: "10 conversations, Fashion Night" },
    { key: "accent", label: "Accent colour", type: "select", options: ACCENTS.map((a) => ({ value: a.value, label: a.label })) },
    { key: "photo", label: "Photo (venue or past summit)", type: "image", shape: "wide" },
  ] },
  { title: "Venue", fields: [
    { key: "venue", label: "Venue", type: "text" },
    { key: "address", label: "Address", type: "text", placeholder: "Street · Postcode City" },
    { key: "mapsUrl", label: "Map link", type: "url", placeholder: "https://maps.google.com/?q=…" },
  ] },
  { title: "Registration", fields: [
    { key: "registration", label: "How people register", type: "select", options: [
      { value: "checkout", label: "Pay online straight away" }, { value: "approval", label: "We approve each request first" }, { value: "closed", label: "Registration closed" } ] },
    { key: "externalRegistrationUrl", label: "External booking page (optional)", type: "url", help: "Only if registration still runs elsewhere — the Register button then links there." },
    { key: "passes", label: "Passes", type: "list", itemLabel: "Pass", max: 6, fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "One-line description", type: "text" },
      { key: "includes", label: "What's included (one per line)", type: "textarea" },
      { key: "price", label: "Price in € (leave empty if not announced)", type: "number" },
      { key: "onRequest", label: "Type", type: "select", options: [{ value: "no", label: "Bookable online" }, { value: "yes", label: "On request (we follow up)" }] },
      { key: "featured", label: "Highlight", type: "select", options: [{ value: "no", label: "Normal" }, { value: "yes", label: "Highlighted pass" }] },
    ] },
  ] },
  { title: "Programme", fields: [
    { key: "programme", label: "Programme", type: "list", itemLabel: "Item", fields: [
      { key: "time", label: "Time", type: "text", placeholder: "09:30" }, { key: "title", label: "Title", type: "text" }, { key: "detail", label: "Detail (optional)", type: "text" } ] },
  ] },
  { title: "Speakers", help: "The section appears once you add the first speaker.", fields: [
    { key: "speakers", label: "Speakers", type: "list", itemLabel: "Speaker", fields: [
      { key: "name", label: "Name", type: "text" }, { key: "title", label: "Title · Company", type: "text" }, { key: "photo", label: "Photo", type: "image", shape: "portrait" } ] },
  ] },
  { title: "Questions", help: "The FAQ appears once you add the first question.", fields: [
    { key: "faq", label: "Questions", type: "list", itemLabel: "Question", fields: [{ key: "q", label: "Question", type: "text" }, { key: "a", label: "Answer", type: "textarea" }] },
  ] },
];

/** Stored event → form values. */
export function toForm(e: Partial<SummitEvent>): Values {
  const accent = ACCENTS.find((a) => a.accent.toLowerCase() === (e.accent ?? "").toLowerCase())?.value ?? "red";
  return {
    series: e.series ?? "Future. Summit", city: e.city ?? "", date: e.date ?? "", startTime: e.startTime ?? "", timezone: e.timezone ?? "Europe/Vienna",
    description: e.description ?? "", tags: e.tags ?? [], accent, photo: e.photo ?? "",
    venue: e.venue ?? "", address: e.address ?? "", mapsUrl: e.mapsUrl ?? "",
    registration: e.registration ?? "checkout", externalRegistrationUrl: e.externalRegistrationUrl ?? "",
    passes: (e.passes ?? []).map((p) => ({ name: p.name, description: p.description, includes: p.includes.join("\n"), price: p.priceCents == null ? "" : p.priceCents / 100, onRequest: p.onRequest ? "yes" : "no", featured: p.featured ? "yes" : "no", id: p.id })),
    programme: e.programme ?? [], speakers: e.speakers ?? [], faq: e.faq ?? [],
  };
}

/** Form values → stored event (validated). Throws Error with a readable message. */
export function fromForm(v: Values, existingSlug?: string): SummitEvent {
  const s = (k: string) => (typeof v[k] === "string" ? (v[k] as string).trim() : "");
  if (!s("city")) throw new Error("Please enter the city.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s("date"))) throw new Error("Please choose the date.");
  if (!s("venue")) throw new Error("Please enter the venue.");
  const acc = ACCENTS.find((a) => a.value === s("accent")) ?? ACCENTS[0];
  const list = <T,>(k: string) => (Array.isArray(v[k]) ? (v[k] as T[]) : []);
  const passes: Pass[] = list<Values>("passes").filter((p) => String(p.name ?? "").trim()).map((p, i) => {
    const price = p.price === "" || p.price == null ? null : Number(p.price);
    if (price != null && (!Number.isFinite(price) || price < 0)) throw new Error(`Pass ${i + 1}: the price must be a number.`);
    return {
      id: String(p.id || slugify(String(p.name)) || `pass-${i + 1}`), name: String(p.name).trim(), description: String(p.description ?? "").trim(),
      includes: String(p.includes ?? "").split("\n").map((x) => x.trim()).filter(Boolean),
      priceCents: price == null ? null : Math.round(price * 100), onRequest: p.onRequest === "yes", featured: p.featured === "yes",
    };
  });
  const url = (x: string) => (x && !/^https?:\/\//i.test(x) ? (() => { throw new Error(`“${x}” must start with https://`); })() : x || undefined);
  return {
    slug: existingSlug || slugify(`${s("series") || "event"} ${s("city")} ${s("date").slice(0, 4)}`),
    series: s("series") || "Future. Summit", city: s("city"), date: s("date"), startTime: s("startTime") || undefined, timezone: s("timezone") || "Europe/Vienna",
    venue: s("venue"), address: s("address"), mapsUrl: url(s("mapsUrl")) ?? `https://maps.google.com/?q=${encodeURIComponent(`${s("venue")} ${s("city")}`)}`,
    description: s("description"), tags: list<string>("tags").map(String), accent: acc.accent, onAccent: acc.on, photo: s("photo") || undefined,
    registration: (["checkout", "approval", "closed"].includes(s("registration")) ? s("registration") : "checkout") as SummitEvent["registration"],
    externalRegistrationUrl: url(s("externalRegistrationUrl")),
    passes, programme: list<Values>("programme").filter((p) => String(p.title ?? "").trim()).map((p) => ({ time: String(p.time ?? ""), title: String(p.title), detail: p.detail ? String(p.detail) : undefined })),
    speakers: list<Values>("speakers").filter((p) => String(p.name ?? "").trim()).map((p) => ({ name: String(p.name), title: String(p.title ?? ""), photo: p.photo ? String(p.photo) : undefined })),
    faq: list<Values>("faq").filter((p) => String(p.q ?? "").trim()).map((p) => ({ q: String(p.q), a: String(p.a ?? "") })),
  };
}
