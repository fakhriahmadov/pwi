import { type SummitEvent, type Pass, DEFAULT_TAGLINE, DEFAULT_THEMES, defaultRegText, faq as defaultFaq } from "@/content/events";
import type { Section, Values } from "./fields";
import { slugify } from "./markdown";
import { accent as accentOf, ACCENT_PRESETS, TEXT_COLOUR_CHOICES } from "./accent";

/** Older saved events used these names; any hex colour now works. */
const LEGACY: Record<string, string> = { red: "#C42F33", black: "#0A0A0A", sand: "#EFE7DA" };

/**
 * Admin → Events → edit. Sections follow the event page from top to bottom, named after its headings,
 * so what an editor sees here is what visitors see there.
 */
export const EVENT_SECTIONS: Section[] = [
  { title: "Top of the page", help: "The dark opening block: title, tagline, the Date / Venue / Programme facts and the buttons.", fields: [
    { key: "series", label: "Series (big title)", type: "text", placeholder: "Future. Summit", help: "The part before the dot is set large, e.g. “Future. Summit”." },
    { key: "city", label: "City", type: "text", help: "Used in “Join us in {city}”, on the Events page and in emails." },
    { key: "tagline", label: "Tagline (under the big title)", type: "textarea", help: "Shown with the standard line until you change it." },
    { key: "date", label: "Date", type: "date" },
    { key: "startTime", label: "Start time", type: "time", help: "Shown as “Doors open …” and used by Add to calendar." },
    { key: "endTime", label: "End time", type: "time", help: "Used by Add to calendar. Leave empty for an all-day entry." },
    { key: "timezone", label: "Time zone", type: "select", options: ["Europe/Vienna", "Europe/Madrid", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Zurich", "Asia/Dubai", "America/New_York"].map((z) => ({ value: z, label: z })) },
    { key: "accent", label: "Event colour (hex)", type: "text", placeholder: "#1E4FE0", help: `Any colour, e.g. ${ACCENT_PRESETS.map((a) => `${a.label} ${a.value}`).join(" · ")}. Used for buttons, the date bar, the evening block and backgrounds.` },
    { key: "textColorMode", label: "Text colour (times, small headings, links, icons)", type: "select", options: TEXT_COLOUR_CHOICES, help: "Automatic: readable colours (e.g. blue) are used for text; light colours (e.g. yellow) give black text with yellow marks. Pick another option to override it." },
    { key: "textColorCustom", label: "Custom text colour (hex)", type: "text", placeholder: "#C42F33", help: "Only used when “Custom colour” is chosen above. Dark colours read best on the white and pale backgrounds." },
  ] },
  { title: "About — The conversation", help: "The first section under the menu: a heading and three theme cards.", fields: [
    { key: "description", label: "Heading", type: "textarea", help: "Also used on the Events page card and in search results." },
    { key: "themes", label: "Theme cards", type: "list", itemLabel: "Theme", max: 6, fields: [{ key: "title", label: "Title", type: "text" }, { key: "text", label: "Text", type: "textarea" }] },
  ] },
  { title: "Programme", help: "“{N} conversations. One day.” — conversations are counted automatically; openings, closings and breaks are not. Add the speakers under Speakers first, then pick them here by name.", fields: [
    { key: "programme", label: "Sessions", type: "list", itemLabel: "Session", fields: [
      { key: "time", label: "Time", type: "text", placeholder: "09:15–10:00" }, { key: "title", label: "Title", type: "text" }, { key: "detail", label: "Focus line (shown beside the title)", type: "text" },
      { key: "isBreak", label: "Kind", type: "select", options: [{ value: "no", label: "Conversation (counted, with speakers)" }, { value: "extra", label: "Opening or closing (outlined box, not counted)" }, { value: "yes", label: "Break, coffee or lunch (slim row)" }] },
      { key: "speakers", label: "Speakers (names, as under Speakers)", type: "tags", help: "Empty: “Speakers to be announced”." } ] },
    { key: "eveningTitle", label: "Evening programme — title", type: "text", placeholder: "Sunset Networking", help: "Shown in the top facts (“Followed by …”) and as the evening block." },
    { key: "eveningTime", label: "Evening programme — time", type: "text", placeholder: "19:00–19:40" },
    { key: "eveningLocation", label: "Evening programme — line under the title", type: "text" },
  ] },
  { title: "Speakers", help: "This year’s speakers, picked by name in the Programme. Unconfirmed speakers stay hidden until you set them to Confirmed.", fields: [
    { key: "speakers", label: "Speakers", type: "list", itemLabel: "Speaker", fields: [
      { key: "name", label: "Name", type: "text" }, { key: "title", label: "Title · Company · Country", type: "text" }, { key: "photo", label: "Photo", type: "image", shape: "portrait", spec: "portrait" },
      { key: "tbc", label: "Status", type: "select", options: [{ value: "no", label: "Confirmed (shown)" }, { value: "yes", label: "To be confirmed (hidden)" }] } ] },
  ] },
  { title: "Previous speakers — Voices from the table", help: "The section appears once you add the first person.", fields: [
    { key: "previous", label: "People", type: "list", itemLabel: "Person", max: 12, fields: [
      { key: "name", label: "Name", type: "text" }, { key: "title", label: "Title · Country", type: "text" }, { key: "photo", label: "Portrait", type: "image", shape: "portrait", spec: "previous" } ] },
  ] },
  { title: "The venue", fields: [
    { key: "venue", label: "Venue", type: "text" },
    { key: "address", label: "Address", type: "text", placeholder: "Street · Postcode City" },
    { key: "venueDesc", label: "About the venue (one or two lines)", type: "textarea" },
    { key: "photo", label: "Venue photo", type: "image", shape: "wide", spec: "venue" },
    { key: "mapsUrl", label: "Map link (“Open in Maps”)", type: "url", placeholder: "https://maps.google.com/?q=…" },
    { key: "cityGuide", label: "City guide link (“Discover {city}”)", type: "url", placeholder: "https://ibiza.travel/en/" },
  ] },
  { title: "Organising partners — In partnership with", help: "The section appears once you add the first partner.", fields: [
    { key: "partners", label: "Partners", type: "list", itemLabel: "Partner", max: 9, fields: [
      { key: "name", label: "Name", type: "text" }, { key: "link", label: "Website (optional)", type: "url" }, { key: "logo", label: "Logo", type: "image", shape: "logo", spec: "logo" } ] },
  ] },
  { title: "Good to know", help: "The questions at the bottom of the page. The standard questions are shown until you change them.", fields: [
    { key: "faq", label: "Questions", type: "list", itemLabel: "Question", fields: [{ key: "q", label: "Question", type: "text" }, { key: "a", label: "Answer", type: "textarea" }] },
  ] },
  { title: "Attend — Join us in {city}", help: "The closing block with the register button, and how registration works.", fields: [
    { key: "regText", label: "Text beside the button", type: "textarea" },
    { key: "email", label: "Contact email (“Questions? …” and partnerships)", type: "email", placeholder: "info@privatewealth.institute" },
    { key: "registration", label: "How people register", type: "select", options: [
      { value: "approval", label: "Request an invitation — we review each request (no prices shown)" },
      { value: "checkout", label: "Pay online straight away (passes and prices shown)" },
      { value: "closed", label: "Registration closed" } ] },
    { key: "externalRegistrationUrl", label: "External booking page (optional)", type: "url", help: "Only if registration still runs elsewhere (e.g. Weezevent) — the buttons then link there." },
    { key: "passes", label: "Passes (shown only with “Pay online straight away”)", type: "list", itemLabel: "Pass", max: 6, fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "One-line description", type: "text" },
      { key: "includes", label: "What's included (one per line)", type: "textarea" },
      { key: "price", label: "Price in € (leave empty if not announced)", type: "number" },
      { key: "onRequest", label: "Type", type: "select", options: [{ value: "no", label: "Bookable online" }, { value: "yes", label: "On request (we follow up)" }] },
      { key: "featured", label: "Highlight", type: "select", options: [{ value: "no", label: "Normal" }, { value: "yes", label: "Highlighted pass (“Most chosen”)" }] },
    ] },
  ] },
  { title: "Events page card", help: "How this event appears in the list on the Events page.", fields: [
    { key: "cardPhoto", label: "Card photo (optional — the venue photo is used otherwise)", type: "image", shape: "wide", spec: "card" },
    { key: "tags", label: "Highlights", type: "tags", placeholder: "10 conversations, Sunset Networking" },
  ] },
];

/** Stored event → form values. */
export function toForm(e: Partial<SummitEvent>): Values {
  const byId = new Map((e.speakers ?? []).map((sp) => [sp.id || sp.name, sp.name]));
  return {
    series: e.series ?? "Future. Summit", city: e.city ?? "", date: e.date ?? "", startTime: e.startTime ?? "", endTime: e.endTime ?? "", timezone: e.timezone ?? "Europe/Vienna",
    // Empty fields show what the page shows in their place.
    tagline: e.tagline || (e.city ? DEFAULT_TAGLINE : ""), description: e.description ?? "", tags: e.tags ?? [], accent: LEGACY[e.accent ?? ""] ?? e.accent ?? "#C42F33",
    textColorMode: !e.textColor ? "auto" : e.textColor === "event" || e.textColor === "marks" ? e.textColor : ["#C42F33", "#0A0A0A"].includes(e.textColor.toUpperCase()) ? e.textColor.toUpperCase() : "custom",
    textColorCustom: e.textColor && e.textColor.startsWith("#") && !["#C42F33", "#0A0A0A"].includes(e.textColor.toUpperCase()) ? e.textColor : "",
    photo: e.photo ?? "", cardPhoto: e.cardPhoto ?? "", themes: e.themes?.length ? e.themes : e.city ? DEFAULT_THEMES : [],
    venue: e.venue ?? "", address: e.address ?? "", mapsUrl: e.mapsUrl ?? "", venueDesc: e.venueDesc ?? "", cityGuide: e.cityGuide ?? "",
    registration: e.registration ?? "checkout", externalRegistrationUrl: e.externalRegistrationUrl ?? "", regText: e.regText || (e.city ? defaultRegText(e.eveningTitle) : ""), email: e.email ?? "",
    passes: (e.passes ?? []).map((p) => ({ name: p.name, description: p.description, includes: p.includes.join("\n"), price: p.priceCents == null ? "" : p.priceCents / 100, onRequest: p.onRequest ? "yes" : "no", featured: p.featured ? "yes" : "no", id: p.id })),
    programme: (e.programme ?? []).map((p) => ({ time: p.time, title: p.title, detail: p.detail ?? "", isBreak: p.isBreak ? "yes" : p.isExtra ? "extra" : "no", speakers: (p.speakers ?? []).map((k) => byId.get(k) ?? k) })),
    eveningTime: e.eveningTime ?? "", eveningTitle: e.eveningTitle ?? "", eveningLocation: e.eveningLocation ?? "",
    speakers: (e.speakers ?? []).map((sp) => ({ name: sp.name, title: sp.title, photo: sp.photo ?? "", tbc: sp.tbc ? "yes" : "no" })),
    previous: e.previous ?? [], partners: e.partners ?? [], faq: e.faq?.length ? e.faq : e.city ? defaultFaq(e.eveningTitle || "The evening programme") : [],
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
  const mode = s("textColorMode") || "auto", custom = s("textColorCustom");
  if (mode === "custom" && !/^#[0-9a-fA-F]{6}$/.test(custom)) throw new Error("The custom text colour must be a hex code like #C42F33.");
  const textColor = mode === "auto" ? undefined : mode === "custom" ? custom.toUpperCase() : mode;
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
    series: s("series") || "Future. Summit", city: s("city"), date: s("date"), startTime: s("startTime") || undefined, endTime: s("endTime") || undefined, timezone: s("timezone") || "Europe/Vienna",
    venue: s("venue"), address: s("address"), mapsUrl: url(s("mapsUrl")) ?? `https://maps.google.com/?q=${encodeURIComponent(`${s("venue")} ${s("city")}`)}`,
    tagline: s("tagline") || undefined, description: s("description"), tags: list<string>("tags").map(String), accent: acc.hex, onAccent: acc.fg, textColor,
    photo: s("photo") || undefined, cardPhoto: s("cardPhoto") || undefined,
    themes: list<Values>("themes").filter((t) => String(t.title ?? "").trim()).map((t) => ({ title: String(t.title).trim(), text: String(t.text ?? "").trim() })),
    venueDesc: s("venueDesc") || undefined, cityGuide: url(s("cityGuide")), email: s("email") || undefined, regText: s("regText") || undefined,
    eveningTime: s("eveningTime") || undefined, eveningTitle: s("eveningTitle") || undefined, eveningLocation: s("eveningLocation") || undefined,
    previous: list<Values>("previous").filter((p) => String(p.name ?? "").trim()).map((p) => ({ name: String(p.name).trim(), title: String(p.title ?? ""), photo: p.photo ? String(p.photo) : undefined })),
    partners: list<Values>("partners").filter((p) => String(p.name ?? "").trim()).map((p) => ({ name: String(p.name).trim(), link: url(String(p.link ?? "").trim()), logo: p.logo ? String(p.logo) : undefined })),
    registration: (["checkout", "approval", "closed"].includes(s("registration")) ? s("registration") : "checkout") as SummitEvent["registration"],
    externalRegistrationUrl: url(s("externalRegistrationUrl")),
    passes, programme: list<Values>("programme").filter((p) => String(p.title ?? "").trim()).map((p) => ({ time: String(p.time ?? ""), title: String(p.title), detail: p.detail ? String(p.detail) : undefined,
      isBreak: p.isBreak === "yes" || undefined, isExtra: p.isBreak === "extra" || undefined, speakers: Array.isArray(p.speakers) && p.speakers.length ? (p.speakers as unknown[]).map(String) : undefined })),
    speakers: list<Values>("speakers").filter((p) => String(p.name ?? "").trim()).map((p) => ({ name: String(p.name).trim(), title: String(p.title ?? ""), photo: p.photo ? String(p.photo) : undefined, tbc: p.tbc === "yes" || undefined })),
    faq: list<Values>("faq").filter((p) => String(p.q ?? "").trim()).map((p) => ({ q: String(p.q), a: String(p.a ?? "") })),
  };
}
