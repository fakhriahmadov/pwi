// One-time content updates to events saved in the database (Admin → Events), applied on deploy after db-sync.
// Each update runs once: a marker row "data-update:<id>" is stored in ContentBlock (kept apart from the event, so
// saving the event in the admin can never make an update run again). Failures are logged and never stop the deploy.
import fs from "node:fs";
import matter from "gray-matter";
import { PrismaClient } from "@prisma/client";

const UPDATES = [
  {
    id: "ibiza-flyer-2026-11",
    slug: "future-summit-ibiza-2027",
    // Programme, times and evening from the A5 flyer (Nov 2026).
    apply(d) {
      const old = Array.isArray(d.programme) ? d.programme : [];
      const speakersOf = (t) => (old.find((o) => o && o.title === t) || {}).speakers || [];
      d.programme = PROGRAMME.map((p) => ({ ...p, speakers: speakersOf(p.title) }));
      d.startTime = "09:00"; d.endTime = "19:40";
      d.eveningTime = "19:00–19:40"; d.eveningTitle = "Sunset Cocktail";
      // Card picture: the Ibiza illustration stored on the site (not the Wix photo), unless one was uploaded in the admin.
      if (!d.cardPhoto || /wixstatic/.test(d.cardPhoto)) d.cardPhoto = "/images/events/ibiza.jpg";
      const s = JSON.stringify(d).replaceAll("followed by sunset networking", "followed by a sunset cocktail").replaceAll("Sunset Networking", "Sunset Cocktail");
      return JSON.parse(s);
    },
  },
];

// Articles kept as files that should also be editable in Admin → Insights right away (same as "Make them editable").
const ARTICLES = ["european-women-billionaires-2026"];

const PROGRAMME = [
  {
    "time": "09:00–09:15",
    "title": "Opening",
    "detail": "Welcome by Vanessium and Family Office Strategist, Main Partner",
    "isExtra": true
  },
  {
    "time": "09:15–10:00",
    "title": "The Founder's Edge",
    "detail": ""
  },
  {
    "time": "10:00–10:45",
    "title": "The Invisible Digital Layer",
    "detail": "AI, SaaS and the technology transforming how we travel, shop and stay"
  },
  {
    "time": "10:45–11:15",
    "title": "Coffee Break & Networking",
    "detail": ""
  },
  {
    "time": "11:15–12:00",
    "title": "What Moves the World",
    "detail": ""
  },
  {
    "time": "12:00–12:45",
    "title": "From Silicon to Cells",
    "detail": ""
  },
  {
    "time": "12:45–13:30",
    "title": "Capital, Wealth & the New Investor",
    "detail": ""
  },
  {
    "time": "13:30–14:30",
    "title": "Summer Lunch",
    "detail": ""
  },
  {
    "time": "14:30–15:15",
    "title": "Places We Live, Places We Return To",
    "detail": "Real estate, hospitality, travel and the new geography of experience"
  },
  {
    "time": "15:15–16:00",
    "title": "Fashion, Beauty & the New Luxury",
    "detail": ""
  },
  {
    "time": "16:00–16:30",
    "title": "Coffee Break & Networking",
    "detail": ""
  },
  {
    "time": "16:30–17:15",
    "title": "Taste of Summer",
    "detail": "Food, hospitality and the businesses shaping how destinations taste"
  },
  {
    "time": "17:15–18:00",
    "title": "The New Culture of Sport & Wellbeing",
    "detail": "Performance, community, travel, wellbeing and the new active lifestyle economy"
  },
  {
    "time": "18:00–18:45",
    "title": "What We Leave Behind",
    "detail": "How families preserve wealth without preserving the past"
  },
  {
    "time": "18:45–19:00",
    "title": "Closing Conversation",
    "detail": "What the day tells us about the future of summer, lifestyle and ownership",
    "isExtra": true
  }
];

if (!process.env.DATABASE_URL) {
  console.log("[data-updates] DATABASE_URL not set — skipping.");
} else if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
  // Vercel also builds a preview for every push, against the same database: only the real deploy may change content.
  console.log(`[data-updates] ${process.env.VERCEL_ENV} build — skipping (content updates run on production deploys only).`);
} else {
  const db = new PrismaClient();
  try {
    for (const u of UPDATES) {
      const key = `data-update:${u.id}`;
      if (await db.contentBlock.findUnique({ where: { key } })) { console.log(`[data-updates] ${u.id}: already applied.`); continue; }
      const row = await db.eventItem.findUnique({ where: { slug: u.slug } });
      if (row) {
        const data = row.data && typeof row.data === "object" ? row.data : {};
        await db.eventItem.update({ where: { slug: u.slug }, data: { data: u.apply(structuredClone(data)) } });
        console.log(`[data-updates] ${u.id}: applied to ${u.slug}.`);
      } else console.log(`[data-updates] ${u.id}: ${u.slug} not in the database (the event file is used) — nothing to change.`);
      await db.contentBlock.create({ data: { key, published: { appliedAt: new Date().toISOString() }, updatedBy: "deploy" } });
    }
    for (const slug of ARTICLES) {
      if (await db.article.findUnique({ where: { slug } })) { console.log(`[data-updates] article ${slug}: already in Admin → Insights.`); continue; }
      const file = `content/articles/${slug}.md`;
      if (!fs.existsSync(file)) continue;
      const { data, content } = matter(fs.readFileSync(file, "utf8"));
      await db.article.create({ data: { slug, title: String(data.title), excerpt: String(data.excerpt ?? ""), topic: String(data.topic ?? "Insights"), author: String(data.author ?? "Private Wealth Institute"), date: String(data.date), body: content.replace(/<!--[\s\S]*?-->/g, "").trim(), status: "published" } });
      console.log(`[data-updates] article ${slug}: added to Admin → Insights (published).`);
    }
  } catch (e) {
    console.error("[data-updates] failed (deploy continues):", e instanceof Error ? e.message : e);
  } finally {
    await db.$disconnect();
  }
}
