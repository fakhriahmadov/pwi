/**
 * EVENTS — edit here.
 * - date: "YYYY-MM-DD". Events move to "Past events" automatically the day after.
 * - priceCents: price per pass in euro cents (e.g. 95000 = €950). null = price not announced yet:
 *   the pass shows "Price to be announced" and checkout stays closed for it.
 * - onRequest: true = no checkout; the registration is saved as an enquiry and the team follows up.
 * - registration: "checkout" (pay straight away), "approval" (the team approves first, then sends a
 *   payment link), or "closed".
 */
export type Pass = {
  id: string;
  name: string;
  description: string;
  includes: string[];
  priceCents: number | null;
  onRequest?: boolean;
  featured?: boolean;
};

export type ProgrammeItem = { time: string; title: string; detail?: string };
export type Speaker = { name: string; title: string; photo?: string };

export type SummitEvent = {
  slug: string;
  series: string;
  city: string;
  date: string;
  startTime?: string; // "09:00", local time
  endTime?: string;
  timezone: string;
  venue: string;
  address: string;
  mapsUrl: string;
  description: string;
  tags: string[];
  accent: string; // event colour — keep to the brand palette (red #C42F33, black #0A0A0A, sand #EFE7DA)
  onAccent: string; // text colour on the accent
  photo?: string;
  capacity?: string;
  registration: "checkout" | "approval" | "closed";
  externalRegistrationUrl?: string; // while an event still sells on another platform
  passes: Pass[];
  programme: ProgrammeItem[];
  speakers: Speaker[];
  faq: { q: string; a: string }[];
};

const standardPasses = (evening: string): Pass[] => [
  {
    id: "summit",
    name: "Summit pass",
    description: "All ten conversations, lunch and networking",
    includes: ["All ten conversations", "Lunch and networking"],
    priceCents: null,
  },
  {
    id: "summit-evening",
    name: `Summit + ${evening}`,
    description: `The full day plus ${evening}`,
    includes: ["Everything in the Summit pass", evening],
    priceCents: null,
    featured: true,
  },
  {
    id: "partner",
    name: "Partner & group",
    description: "Tables, group seats and brand presence",
    includes: ["Tables and group seats", "Brand presence at the summit"],
    priceCents: null,
    onRequest: true,
  },
];

export const events: SummitEvent[] = [
  {
    slug: "future-summit-vienna-2026",
    series: "Future. Summit",
    city: "Vienna",
    date: "2026-11-12",
    timezone: "Europe/Vienna",
    venue: "The Ritz-Carlton, Vienna",
    address: "Schubertring 5–7 · 1010 Vienna",
    mapsUrl: "https://maps.google.com/?q=The+Ritz-Carlton+Vienna+Schubertring+5-7",
    description:
      "One day with founders, families and the people shaping private capital — ten conversations on what comes next, followed by Fashion Night.",
    tags: ["10 conversations", "Fashion Night"],
    accent: "#C42F33",
    onAccent: "#FFFFFF",
    registration: "checkout",
    // Vienna keeps selling on the current Wix page until the new site launches.
    externalRegistrationUrl: "https://www.privatewealth.institute/event-details/future-summit-vienna",
    passes: standardPasses("Fashion Night"),
    programme: [
      { time: "Morning", title: "Arrival & welcome" },
      { time: "", title: "Conversations 1–5", detail: "Titles announced as speakers confirm" },
      { time: "Midday", title: "Lunch & networking" },
      { time: "", title: "Conversations 6–10", detail: "Titles announced as speakers confirm" },
      { time: "Evening", title: "Fashion Night" },
    ],
    speakers: [],
    faq: [],
  },
  {
    slug: "future-summit-ibiza-2027",
    series: "Future. Summit",
    city: "Ibiza",
    date: "2027-06-11",
    timezone: "Europe/Madrid",
    venue: "Hotel Aguas de Ibiza",
    address: "Salvador Camacho 9 · 07840 Santa Eulària des Riu",
    mapsUrl: "https://maps.google.com/?q=Hotel+Aguas+de+Ibiza",
    description:
      "A summer day on how we live, travel, celebrate and own — ten conversations, followed by sunset networking.",
    tags: ["10 conversations", "Sunset Networking"],
    accent: "#EFE7DA",
    onAccent: "#0A0A0A",
    registration: "checkout",
    passes: standardPasses("Sunset Networking"),
    programme: [
      { time: "Morning", title: "Arrival & welcome" },
      { time: "", title: "Conversations 1–5", detail: "Titles announced as speakers confirm" },
      { time: "Midday", title: "Lunch" },
      { time: "", title: "Conversations 6–10", detail: "Titles announced as speakers confirm" },
      { time: "Sunset", title: "Sunset Networking" },
    ],
    speakers: [],
    faq: [],
  },
];
