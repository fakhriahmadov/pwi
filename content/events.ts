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

/** A programme slot. `speakers` lists speaker ids (or names); `isBreak` = arrival, lunch, coffee… (shown as a slim row). */
export type ProgrammeItem = { time: string; title: string; detail?: string; speakers?: string[]; isBreak?: boolean };
/** tbc = not yet confirmed: hidden on the page until confirmed. */
export type Speaker = { id?: string; name: string; title: string; photo?: string; tbc?: boolean };
export type Person = { name: string; title: string; photo?: string };
export type Partner = { name: string; link?: string; logo?: string };

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
  accent: string; // event colour, any hex — e.g. Vienna blue #1E4FE0, Ibiza yellow #F5C400. Readable variants are derived automatically.
  onAccent: string; // text colour on the accent (derived; kept for older saved events)
  photo?: string; // venue photo
  cardPhoto?: string; // photo on the Events page card (falls back to the venue photo)
  tagline?: string; // one line under the big title
  themes?: { title: string; text: string }[]; // "The conversation" cards
  eveningTime?: string;
  eveningTitle?: string; // e.g. Fashion Night
  eveningLocation?: string;
  venueDesc?: string;
  cityGuide?: string; // link for "Discover {city}"
  email?: string; // questions / partnerships
  regText?: string; // text in the "Join us" block
  previous?: Person[]; // previous speakers
  partners?: Partner[];
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
    startTime: "09:15",
    timezone: "Europe/Vienna",
    venue: "The Ritz-Carlton, Vienna",
    address: "Schubertring 5–7 · 1010 Vienna",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Ritz-Carlton+Vienna+Schubertring+5-7",
    tagline: "A conversation about how we will live, build businesses and shape wealth in a changing world.",
    description: "One day in Vienna with founders, families and the people shaping private capital — on what comes next.",
    tags: ["9 conversations", "Fashion Night"],
    accent: "#1E4FE0",
    onAccent: "#FFFFFF",
    photo: "/images/events/vienna.jpg",
    themes: [{"title": "How we will live", "text": "Lifestyle, status, longevity, home and the experiences that define a new generation of wealth."}, {"title": "How we build businesses", "text": "The entrepreneurial mindset, rewired — and the family enterprises carrying legacy into the next century."}, {"title": "How we shape wealth", "text": "The fluidity of capital across borders, generations and asset classes — and style as a form of capital itself."}],
    eveningTime: "20:00",
    eveningTitle: "Fashion Night",
    eveningLocation: "Location to be announced",
    venueDesc: "On the Ringstrasse, in a city long at the crossroads of European capital, culture and diplomacy.",
    cityGuide: "https://www.wien.info/en",
    email: "info@privatewealth.institute",
    regText: "Register as an attendee for a full day of conversations with founders, family principals and investors — followed by the evening programme.",
    registration: "checkout",
    externalRegistrationUrl: "https://my.weezevent.com/future-summit-vienna",
    passes: standardPasses("Fashion Night"),
    programme: [{"time": "09:15", "title": "Next Society: Lifestyle, Behaviour, Status", "speakers": ["v1", "v2", "v3"]}, {"time": "10:00", "title": "The Entrepreneurial Mindset, Rewired", "speakers": ["v4", "v5", "v6"]}, {"time": "11:15", "title": "The Power of Legacy: Family Business", "speakers": ["v7", "v8", "v9"]}, {"time": "12:00", "title": "The Fluidity of Wealth", "speakers": ["v10", "v11", "v12", "v13"]}, {"time": "14:00", "title": "Style as Capital", "speakers": ["v14", "v15"]}, {"time": "14:45", "title": "The New Meaning of Home & Away", "speakers": ["v16", "v17", "v18"]}, {"time": "15:30", "title": "Experience Boom: Music, Travel, Lodging", "speakers": ["v19", "v20", "v21"]}, {"time": "16:45", "title": "The Business of Living Longer", "speakers": ["v22", "v23", "v24"]}, {"time": "17:15", "title": "The Taste of the Future", "speakers": ["v25", "v26", "v27"]}],
    speakers: [{"id": "v1", "name": "Carlota Pi Amorós", "title": "Co-Founder, Chairperson & CEO at Holaluz, Spain"}, {"id": "v2", "name": "Christian Claussen", "title": "General Partner of Ventech Venture Capital, Germany"}, {"id": "v3", "name": "Laslo Horvath", "title": "Co-founder & CTO of Ominimo (unicorn), Serbia"}, {"id": "v4", "name": "Dieter Grebner", "title": "Founder & CEO of PEAK Technology, Austria"}, {"id": "v5", "name": "Stephane Lavallee", "title": "Serial Entrepreneur in Medical Robotics, France"}, {"id": "v6", "name": "Nicolas Aubé", "title": "Founder & President of CELESTE, France"}, {"id": "v7", "name": "Ignacio Conesa Zamora", "title": "Board Member of Zamora Company, Spain"}, {"id": "v8", "name": "Djena Altrad", "title": "Shareholder Family Member of Altrad Group, France"}, {"id": "v9", "name": "Federica Minozzi", "title": "CEO / Owner Family Member of Iris Ceramica, Italy", "tbc": true}, {"id": "v10", "name": "Loïc Féry", "title": "Founder & CEO of Chenavari Investment Managers, France"}, {"id": "v11", "name": "Marc Syz", "title": "Co-founder & Managing Partner of BYZ Partners, Switzerland"}, {"id": "v12", "name": "Omar Koleilat", "title": "Co-founder & Chairman of Crestyl, Czechia"}, {"id": "v13", "name": "Ian Marsh", "title": "Partner of DN Capital, United Kingdom"}, {"id": "v14", "name": "Paola Sasplugas", "title": "Co-founder & Creative Director, PDPAOLA Jewelry, Spain"}, {"id": "v15", "name": "Monica Ciabattini", "title": "Co-founder of Le Silla, Italy"}, {"id": "v16", "name": "Travis Pittman", "title": "Co-founder & CEO of TourRadar.com, Austria"}, {"id": "v17", "name": "Luigi Passera", "title": "Co-owner & CEO of Lario Hotels, Italy"}, {"id": "v18", "name": "Thierry Herrmann", "title": "CEO of Herrmann Immeubles Group, France"}, {"id": "v19", "name": "Paolo De Nadai", "title": "Founder, WeRoad-OneDay Group, Italy"}, {"id": "v20", "name": "Lorrain de Silva", "title": "Managing Director of Best Nights VC, Jägermeister's venture arm, Germany"}, {"id": "v21", "name": "Patrick Ciorcila", "title": "Tennis Player, Head of Tournament WTA250, Romania"}, {"id": "v22", "name": "Thomas Clozel", "title": "Co-founder of OWKIN, France"}, {"id": "v23", "name": "Dr Randolf Kerschbaumer", "title": "Founder & CEO of OncoOne, Austria"}, {"id": "v24", "name": "Dr Lukas Guenter", "title": "Venture Partner of Kurma Partners, Germany"}, {"id": "v25", "name": "Frederik Jensen", "title": "Founder & CEO of SUMM Ingredients, Denmark"}, {"id": "v26", "name": "Hermes Sanctorum", "title": "Co-founder & CEO of Paleo Bio, Belgium"}, {"id": "v27", "name": "Bosco Emparanza García", "title": "Founder & CEO of MOA Foodtech, Spain"}],
    previous: [{"name": "Hary Tanoesoedibjo", "title": "Chairman, MNC Group · Indonesia", "photo": "/images/speakers/previous-1.jpg"}, {"name": "Neerja Birla", "title": "Chairperson, MPower / Aditya Birla Education Trust · India", "photo": "/images/speakers/previous-2.jpg"}, {"name": "Frank Otto", "title": "Serial Entrepreneur · Germany", "photo": "/images/speakers/previous-3.jpg"}, {"name": "Pasquale Natuzzi Jr.", "title": "Natuzzi Group · Italy", "photo": "/images/speakers/previous-4.jpg"}],
    partners: [{"name": "FO Strategist", "link": "https://www.fostrategist.com/"}, {"name": "LabMaks", "link": "https://labmaks.com/"}, {"name": "Vanessium", "link": "https://vanessium.com/"}],
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
    accent: "#F5C400",
    onAccent: "#0A0A0A",
    photo: "/images/events/ibiza.jpg",
    eveningTitle: "Sunset Networking",
    email: "info@privatewealth.institute",
    registration: "checkout",
    passes: standardPasses("Sunset Networking"),
    programme: [
      { time: "Morning", title: "Arrival & welcome", isBreak: true },
      { time: "", title: "Conversations 1–5", detail: "Titles announced as speakers confirm" },
      { time: "Midday", title: "Lunch", isBreak: true },
      { time: "", title: "Conversations 6–10", detail: "Titles announced as speakers confirm" },
    ],
    speakers: [],
    faq: [],
  },
];
