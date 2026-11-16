import type { SummitEvent, Pass } from "@/content/events";
import type { Section, Values } from "./fields";
import { slugify } from "./markdown";
import { accent as accentOf, ACCENT_PRESETS } from "./accent";

/** Older saved events used these names; any hex colour now works. */
const LEGACY: Record<string, string> = { red: "#C42F33", black: "#0A0A0A", sand: "#EFE7DA" };

export const EVENT_SECTIONS: Section[] = [
  { title: "Basics", fields: [
    { key: "series", label: "Series", type: "text", placeholder: "Future. Summit" },
    { key: "city", label: "City", type: "text", help: "Shown large on the event page." },
    { key: "date", label: "Date", type: "date" },
    { key: "startTime", label: "Start time (optional)", type: "time" },
    { key: "timezone", label: "Time zone", type: "select", options: ["Europe/Vienna", "Europe/Madrid", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Zurich", "Asia/Dubai", "America/New_York"].map((z) => ({ value: z, label: z })) },
    { key: "tagline", label: "Tagline (under the big title)", type: "text", placeholder: "A conversation about how we will live, build businesses and shape wealth" },
    { key: "description", label: "Description", type: "textarea", help: "Shown on the Events page card and as the heading of “The conversation”." },
    { key: "tags", label: "Highlights", type: "tags", placeholder: "10 conversations, Fashion Night" },
    { key: "accent", label: "Event colour (hex)", type: "text", placeholder: "#1E4FE0", help: `Any colour, e.g. ${ACCENT_PRESETS.map((a) => `${a.label} ${a.value}`).join(" · ")}. Text shades are adjusted automatically so they stay readable.` },
    { key: "photo", label: "Venue photo", type: "image", shape: "wide", spec: "venue" },
    { key: "cardPhoto", label: "Events page card photo (optional)", type: "image", shape: "wide", spec: "card" },
  ] },
  { title: "The conversation", help: "Three theme cards under the description. Leave empty for the standard three.", fields: [
    { key: "themes", label: "Themes", type: "list", itemLabel: "Theme", max: 6, fields: [{ key: "title", label: "Title", type: "text" }, { key: "text", label: "Text", type: "textarea" }] },
  ] },
  { title: "Venue", fields: [
    { key: "venue", label: "Venue", type: "text" },
    { key: "address", label: "Address", type: "text", placeholder: "Street · Postcode City" },
    { key: "mapsUrl", label: "Map link", type: "url", placeholder: "https://maps.google.com/?q=…" },
    { key: "venueDesc", label: "About the venue (one or two lines)", type: "textarea" },
    { key: "cityGuide", label: "City guide link (“Discover the city”)", type: "url", placeholder: "https://www.wien.info/en" },
  ] },
  { title: "Registration", fields: [
    { key: "registration", label: "How people register", type: "select", options: [
      { value: "checkout", label: "Pay online straight away" }, { value: "approval", label: "We approve each request first" }, { value: "closed", label: "Registration closed" } ] },
    { key: "externalRegistrationUrl", label: "External booking page (optional)", type: "url", help: "Only if registration still runs elsewhere (e.g. Weezevent) — the Register buttons then link there and passes are hidden." },
    { key: "regText", label: "Text in the “Join us” block", type: "textarea" },
    { key: "email", label: "Contact email for questions and partnerships", type: "email", placeholder: "info@privatewealth.institute" },
    { key: "passes", label: "Passes", type: "list", itemLabel: "Pass", max: 6, fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "One-line description", type: "text" },
      { key: "includes", label: "What's included (one per line)", type: "textarea" },
      { key: "price", label: "Price in € (leave empty if not announced)", type: "number" },
      { key: "onRequest", label: "Type", type: "select", options: [{ value: "no", label: "Bookable online" }, { value: "yes", label: "On request (we follow up)" }] },
      { key: "featured", label: "Highlight", type: "select", options: [{ value: "no", label: "Normal" }, { value: "yes", label: "Highlighted pass" }] },
    ] },
  ] },
  { title: "Programme", help: "Each conversation lists its speakers by name — add the speakers under Speakers first.", fields: [
    { key: "programme", label: "Programme", type: "list", itemLabel: "Item", fields: [
      { key: "time", label: "Time", type: "text", placeholder: "09:30" }, { key: "title", label: "Title", type: "text" }, { key: "detail", label: "Detail (optional)", type: "text" },
      { key: "isBreak", label: "Kind", type: "select", options: [{ value: "no", label: "Conversation (with speakers)" }, { value: "yes", label: "Break, arrival or lunch (slim row)" }] },
      { key: "speakers", label: "Speakers (names, as under Speakers)", type: "tags" } ] },
    { key: "eveningTime", label: "Evening programme — time", type: "text", placeholder: "20:00" },
    { key: "eveningTitle", label: "Evening programme — title", type: "text", placeholder: "Fashion Night" },
    { key: "eveningLocation", label: "Evening programme — place", type: "text" },
  ] },
  { title: "Speakers", help: "People in this year’s programme. Unconfirmed speakers stay hidden until you set them to Confirmed.", fields: [
    { key: "speakers", label: "Speakers", type: "list", itemLabel: "Speaker", fields: [
      { key: "name", label: "Name", type: "text" }, { key: "title", label: "Title · Company · Country", type: "text" }, { key: "photo", label: "Photo", type: "image", shape: "portrait", spec: "portrait" },
      { key: "tbc", label: "Status", type: "select", options: [{ value: "no", label: "Confirmed (shown)" }, { value: "yes", label: "To be confirmed (hidden)" }] } ] },
  ] },
  { title: "Previous speakers", help: "“Voices from the table”.", fields: [
    { key: "previous", label: "Previous speakers", type: "list", itemLabel: "Person", max: 12, fields: [
      { key: "name", label: "Name", type: "text" }, { key: "title", label: "Title · Country", type: "text" }, { key: "photo", label: "Portrait", type: "image", shape: "portrait", spec: "previous" } ] },
  ] },
  { title: "Partners", fields: [
    { key: "partners", label: "Partners", type: "list", itemLabel: "Partner", max: 9, fields: [
      { key: "name", label: "Name", type: "text" }, { key: "link", label: "Website", type: "url" }, { key: "logo", label: "Logo", type: "image", shape: "logo", spec: "logo" } ] },
  ] },
  { title: "Questions", help: "The FAQ appears once you add the first question.", fields: [
    { key: "faq", label: "Questions", type: "list", itemLabel: "Question", fields: [{ key: "q", label: "Question", type: "text" }, { key: "a", label: "Answer", type: "textarea" }] },
  ] },
];

/** Stored event → form values. */
export function toForm(e: Partial<SummitEvent>): Values {
  const byId = new Map((e.speakers ?? []).map((sp) => [sp.id || sp.name, sp.name]));
  return {
    series: e.series ?? "Future. Summit", city: e.city ?? "", date: e.date ?? "", startTime: e.startTime ?? "", timezone: e.timezone ?? "Europe/Vienna",
    tagline: e.tagline ?? "", description: e.description ?? "", tags: e.tags ?? [], accent: LEGACY[e.accent ?? ""] ?? e.accent ?? "#C42F33",
    photo: e.photo ?? "", cardPhoto: e.cardPhoto ?? "", themes: e.themes ?? [],
    venue: e.venue ?? "", address: e.address ?? "", mapsUrl: e.mapsUrl ?? "", venueDesc: e.venueDesc ?? "", cityGuide: e.cityGuide ?? "",
    registration: e.registration ?? "checkout", externalRegistrationUrl: e.externalRegistrationUrl ?? "", regText: e.regText ?? "", email: e.email ?? "",
    passes: (e.passes ?? []).map((p) => ({ name: p.name, description: p.description, includes: p.includes.join("\n"), price: p.priceCents == null ? "" : p.priceCents / 100, onRequest: p.onRequest ? "yes" : "no", featured: p.featured ? "yes" : "no", id: p.id })),
    programme: (e.programme ?? []).map((p) => ({ time: p.time, title: p.title, detail: p.detail ?? "", isBreak: p.isBreak ? "yes" : "no", speakers: (p.speakers ?? []).map((k) => byId.get(k) ?? k) })),
    eveningTime: e.eveningTime ?? "", eveningTitle: e.eveningTitle ?? "", eveningLocation: e.eveningLocation ?? "",
    speakers: (e.speakers ?? []).map((sp) => ({ name: sp.name, title: sp.title, photo: sp.photo ?? "", tbc: sp.tbc ? "yes" : "no" })),
    previous: e.previous ?? [], partners: e.partners ?? [], faq: e.faq ?? [],
  };
}

/** Form values → stored event (validated). Throws Error with a readable message. */
export function fromForm(v: Values, existingSlug?: string): SummitEvent {
  const s = (k: string) => (typeof v[k] === "string" ? (v[k] as string).trim() : "");
  if (!s("city")) throw new Error("Please enter the city.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s("date"))) throw new Error("Please choose the date.");
  if (!s("venue")) throw new Error("Please enter the venue.");
  const accHex = LEGACY[s("accent")] ?? s("accent");
  if (accHex && !/^#[0-9a-fA-F]{6}$/.test(accHex)) throw new Error("The event colour must be a hex code like #1E4FE0.");
  const acc = accentOf(accHex || "#C42F33");
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
    v: 2,
    slug: existingSlug || slugify(`${s("series") || "event"} ${s("city")} ${s("date").slice(0, 4)}`),
    series: s("series") || "Future. Summit", city: s("city"), date: s("date"), startTime: s("startTime") || undefined, timezone: s("timezone") || "Europe/Vienna",
    venue: s("venue"), address: s("address"), mapsUrl: url(s("mapsUrl")) ?? `https://maps.google.com/?q=${encodeURIComponent(`${s("venue")} ${s("city")}`)}`,
    tagline: s("tagline") || undefined, description: s("description"), tags: list<string>("tags").map(String), accent: acc.hex, onAccent: acc.fg,
    photo: s("photo") || undefined, cardPhoto: s("cardPhoto") || undefined,
    themes: list<Values>("themes").filter((t) => String(t.title ?? "").trim()).map((t) => ({ title: String(t.title).trim(), text: String(t.text ?? "").trim() })),
    venueDesc: s("venueDesc") || undefined, cityGuide: url(s("cityGuide")), email: s("email") || undefined, regText: s("regText") || undefined,
    eveningTime: s("eveningTime") || undefined, eveningTitle: s("eveningTitle") || undefined, eveningLocation: s("eveningLocation") || undefined,
    previous: list<Values>("previous").filter((p) => String(p.name ?? "").trim()).map((p) => ({ name: String(p.name).trim(), title: String(p.title ?? ""), photo: p.photo ? String(p.photo) : undefined })),
    partners: list<Values>("partners").filter((p) => String(p.name ?? "").trim()).map((p) => ({ name: String(p.name).trim(), link: url(String(p.link ?? "").trim()), logo: p.logo ? String(p.logo) : undefined })),
    registration: (["checkout", "approval", "closed"].includes(s("registration")) ? s("registration") : "checkout") as SummitEvent["registration"],
    externalRegistrationUrl: url(s("externalRegistrationUrl")),
    passes, programme: list<Values>("programme").filter((p) => String(p.title ?? "").trim()).map((p) => ({ time: String(p.time ?? ""), title: String(p.title), detail: p.detail ? String(p.detail) : undefined,
      isBreak: p.isBreak === "yes" || undefined, speakers: Array.isArray(p.speakers) && p.speakers.length ? (p.speakers as unknown[]).map(String) : undefined })),
    speakers: list<Values>("speakers").filter((p) => String(p.name ?? "").trim()).map((p) => ({ name: String(p.name).trim(), title: String(p.title ?? ""), photo: p.photo ? String(p.photo) : undefined, tbc: p.tbc === "yes" || undefined })),
    faq: list<Values>("faq").filter((p) => String(p.q ?? "").trim()).map((p) => ({ q: String(p.q), a: String(p.a ?? "") })),
  };
}
