import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Section, Values } from "./fields";

const legal = (name: string) => {
  try {
    const { data, content } = matter(fs.readFileSync(path.join(process.cwd(), "content/legal", `${name}.md`), "utf8"));
    return { title: String(data.title ?? name), body: content.trim() };
  } catch { return { title: name, body: "" }; }
};

export type PageDef = { key: string; label: string; group: "Site" | "Pages" | "Legal"; path?: string; description: string; sections: Section[]; defaults: Values };

/** Every editable block. Defaults = the text the site shows until an admin publishes changes. */
export const PAGES: PageDef[] = [
  {
    key: "settings", label: "Site settings", group: "Site", description: "Contact details, social links and lines used across the site.",
    sections: [
      { title: "Identity", fields: [
        { key: "tagline", label: "Tagline", type: "textarea", help: "Used on Insights and in search results." },
        { key: "readers", label: "Readers line", type: "text", help: "Shown in the hero of Home and Insights." },
      ] },
      { title: "Contact", fields: [
        { key: "email", label: "General email", type: "email" },
        { key: "pressEmail", label: "Press email", type: "email", help: "Leave empty to hide." },
        { key: "address", label: "Office address", type: "textarea", help: "Shown on Contact and in the footer. Leave empty to hide." },
      ] },
      { title: "Social", fields: [
        { key: "linkedin", label: "LinkedIn page", type: "url", placeholder: "https://www.linkedin.com/company/…" },
        { key: "instagram", label: "Instagram", type: "url", placeholder: "https://www.instagram.com/…" },
      ] },
    ],
    defaults: {
      tagline: "Research and commentary on how private wealth is created, kept and passed on — across industries, countries and generations.",
      readers: "The leading source for large business owners", email: "info@privatewealth.institute", pressEmail: "", address: "", linkedin: "", instagram: "",
    },
  },
  {
    key: "home", label: "Home", group: "Pages", path: "/", description: "Hero, the three pillars, section titles and the newsletter band.",
    sections: [
      { title: "Hero", fields: [
        { key: "kicker", label: "Small label above the headline", type: "text" },
        { key: "headline", label: "Headline", type: "textarea", help: "A red dot is added at the end automatically." },
        { key: "lead", label: "Introduction", type: "textarea" },
      ] },
      { title: "What we do", fields: [
        { key: "pillarsKicker", label: "Label", type: "text" },
        { key: "pillarsTitle", label: "Title", type: "text" },
        { key: "pillarsIntro", label: "Introduction", type: "textarea" },
        { key: "pillars", label: "Pillars", type: "list", itemLabel: "Pillar", max: 2, help: "Two tiles: the first links to Insights (articles and indexes), the second to Events.", fields: [
          { key: "title", label: "Title", type: "text" }, { key: "text", label: "Text", type: "textarea" }, { key: "link", label: "Link label", type: "text" },
        ] },
      ] },
      { title: "Sections", fields: [
        { key: "eventsTitle", label: "Events section title", type: "text" },
        { key: "insightsTitle", label: "Insights section title", type: "text" },
        { key: "indexesTitle", label: "Indexes band title", type: "text" },
        { key: "indexesText", label: "Indexes band text", type: "textarea" },
        { key: "newsletterTitle", label: "Newsletter title", type: "text" },
        { key: "newsletterText", label: "Newsletter text", type: "textarea" },
      ] },
    ],
    defaults: {
      kicker: "Private Wealth Institute", headline: "How wealth is made, kept and passed on",
      lead: "Research and commentary on how private wealth is created, kept and passed on — across industries, countries and generations.",
      pillarsKicker: "What we do", pillarsTitle: "Study it. Explain it. Bring the people together.",
      pillarsIntro: "Three ways in: independent research, regular commentary, and private convenings for founders, families and the people shaping private capital.",
      pillars: [
        { title: "Insights", text: "Research, commentary and global wealth indexes — from the EuroCapital Index to Gen Z, written for owners of large businesses.", link: "Explore insights & indexes →" },
        { title: "Summits", text: "Future. Summit — one-day private conversations on how we live, build businesses and shape wealth.", link: "All events →" },
      ],
      eventsTitle: "Future. Summit", insightsTitle: "Latest research & commentary",
      indexesTitle: "Where the world's private capital is built", indexesText: "Global, regional and generational indexes — from the EuroCapital Index to Gen Z.",
      newsletterTitle: "The next insight", newsletterText: "Research, index updates and upcoming events — in one email, as often as you like.",
    },
  },
  {
    key: "insights", label: "Insights page", group: "Pages", path: "/insights", description: "Introduction and the newsletter box title. Articles are edited under Insights, indexes under Indexes.",
    sections: [{ title: "Text", fields: [
      { key: "lead", label: "Introduction", type: "textarea" },
      { key: "newsletterTitle", label: "Newsletter title", type: "text" },
    ] }],
    defaults: { lead: "Indexes, research and commentary on how private wealth is created, kept and passed on — across industries, countries and generations.", newsletterTitle: "The briefing" },
  },
  {
    key: "indexes", label: "Insights page — methodology", group: "Pages", path: "/insights", description: "The “How the indexes are built” section on the Insights page (closed until a visitor opens it). Indexes and data are edited under Indexes.",
    sections: [
      { title: "Hero", fields: [{ key: "lead", label: "Introduction", type: "textarea" }] },
      { title: "Methodology", fields: [
        { key: "methodTitle", label: "Title", type: "text" },
        { key: "steps", label: "Steps", type: "list", itemLabel: "Step", max: 6, fields: [{ key: "title", label: "Title", type: "text" }, { key: "text", label: "Text", type: "textarea" }] },
      ] },
    ],
    defaults: {
      lead: "Global indexes and long-run studies of how fortunes are built across industries, countries and generations.",
      methodTitle: "How the indexes are built",
      steps: [
        { title: "Data", text: "One record per fortune per year: country, industry, net worth in euros and, where known, the holder's birth year." },
        { title: "Tags", text: "Each fortune is tagged by region, country, industry and generation, plus themes such as family business or self-made." },
        { title: "Indexes", text: "An index groups the fortunes that share a set of tags — for example Europe, or Gen Z." },
        { title: "Level", text: "The index level is the group's combined wealth relative to its base year, which is set to 100." },
      ],
    },
  },
  {
    key: "events", label: "Events page", group: "Pages", path: "/events", description: "Introduction and newsletter band. Each summit is edited under Events.",
    sections: [{ title: "Text", fields: [
      { key: "lead", label: "Introduction", type: "textarea" },
      { key: "formatTitle", label: "Format headline", type: "text" },
      { key: "formatText", label: "Format text", type: "text" },
      { key: "newsletterTitle", label: "Newsletter title", type: "text" },
    ] }],
    defaults: { lead: "Private conversations on how we live, build businesses and shape wealth — in the places that set the tone.", formatTitle: "One-day summits", formatText: "Conversations, networking and evening programmes", newsletterTitle: "The next conversation" },
  },
  {
    key: "contact", label: "Contact page", group: "Pages", path: "/contact", description: "Introduction and the partnership box. Email and address come from Site settings.",
    sections: [{ title: "Text", fields: [
      { key: "lead", label: "Introduction", type: "textarea" },
      { key: "partnerTitle", label: "Partnership box title", type: "text" },
      { key: "partnerText", label: "Partnership box text", type: "textarea" },
    ] }],
    defaults: { lead: "Partnerships, press, speaking and research requests — tell us what you have in mind.", partnerTitle: "Partner a Future. Summit", partnerText: "Brand presence, hosted tables and conversations at our summits. Choose “Partnership & sponsorship” in the form." },
  },
  {
    key: "footer", label: "Footer", group: "Site", description: "The short description under the logo in the footer.",
    sections: [{ title: "Text", fields: [{ key: "blurb", label: "Description", type: "textarea" }] }],
    defaults: { blurb: "Research and commentary on how private wealth is created, kept and passed on." },
  },
  ...(["imprint", "privacy", "cookies", "terms"] as const).map((name): PageDef => ({
    key: `legal-${name}`, label: legal(name).title, group: "Legal", path: `/legal/${name}`, description: "Legal text. Formatting uses the same buttons as articles.",
    sections: [{ title: "Content", fields: [{ key: "title", label: "Title", type: "text" }, { key: "body", label: "Text", type: "markdown" }] }],
    defaults: legal(name),
  })),
];

export const pageDef = (key: string) => PAGES.find((p) => p.key === key);
