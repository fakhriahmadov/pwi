import { db, dbConfigured } from "./db";

export type AboutData = {
  intro: string;
  subIntro: string;
  founder: { name: string; role: string; bio: string; quote: string; photo: string | null };
  team: { id: string; name: string; role: string; bio: string; group: string; photo: string | null; linkedin: string }[];
  milestones: { id: string; year: string; text: string }[];
  partners: { id: string; name: string; kind: string; url: string; logo: string | null }[];
};

export const mediaUrl = (id?: string | null) => (id ? `/media/${id}` : null);

/** Defaults shown until the admin saves content. */
export const ABOUT_DEFAULTS: AboutData = {
  intro: "The Private Wealth Institute studies how private wealth is created, kept and passed on — across industries, countries and generations.",
  subIntro: "We publish research and commentary for owners of large businesses, maintain the EuroCapital Index, and host Future. Summit — private conversations in the places that set the tone.",
  founder: { name: "Fakhri Ahmadov", role: "", bio: "Author of the institute's research on billionaire wealth across industries, countries and generations.", quote: "", photo: null },
  team: [],
  milestones: [
    { id: "d1", year: "2018", text: "First published research — entrepreneurship in the gaming and casino industry." },
    { id: "d2", year: "2020", text: "Series on billionaires by country, industry and gender — Spain, China, cosmetics." },
    { id: "d3", year: "2026", text: "Future. Summit Vienna at The Ritz-Carlton — ten conversations and Fashion Night." },
    { id: "d4", year: "2027", text: "Future. Summit Ibiza at Hotel Aguas de Ibiza." },
  ],
  partners: [],
};

export async function getAbout(): Promise<AboutData> {
  if (!dbConfigured()) return ABOUT_DEFAULTS;
  try {
    const [c, team, milestones, partners] = await Promise.all([
      db.aboutContent.findUnique({ where: { id: "about" } }),
      db.teamMember.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
      db.milestone.findMany({ orderBy: [{ order: "asc" }, { year: "asc" }] }),
      db.partner.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    ]);
    const d = ABOUT_DEFAULTS;
    return {
      intro: c?.intro || d.intro,
      subIntro: c?.subIntro || d.subIntro,
      founder: {
        name: c?.founderName || d.founder.name,
        role: c?.founderRole ?? d.founder.role,
        bio: c?.founderBio || d.founder.bio,
        quote: c?.founderQuote ?? "",
        photo: mediaUrl(c?.founderPhotoId),
      },
      team: team.map((t) => ({ id: t.id, name: t.name, role: t.role ?? "", bio: t.bio ?? "", group: t.group, photo: mediaUrl(t.photoId), linkedin: t.linkedin ?? "" })),
      // Until the first milestone is saved, keep showing the defaults.
      milestones: milestones.length ? milestones.map((m) => ({ id: m.id, year: m.year, text: m.text })) : d.milestones,
      partners: partners.map((p) => ({ id: p.id, name: p.name, kind: p.kind, url: p.url ?? "", logo: mediaUrl(p.logoId) })),
    };
  } catch (e) {
    console.error("[about] falling back to defaults", e);
    return ABOUT_DEFAULTS;
  }
}
