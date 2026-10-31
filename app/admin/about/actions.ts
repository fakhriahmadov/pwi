"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/avif"];

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const int = (fd: FormData, k: string) => Number.parseInt(str(fd, k) || "0", 10) || 0;

class UserError extends Error {}

/** Saves an uploaded image and returns its id, or undefined when no file was chosen. */
async function saveUpload(fd: FormData, key: string): Promise<string | undefined> {
  const f = fd.get(key);
  if (!f || typeof f === "string" || f.size === 0) return undefined;
  if (!TYPES.includes(f.type)) throw new UserError("Images must be JPG, PNG, WebP, AVIF or SVG.");
  if (f.size > MAX_BYTES) throw new UserError("Images must be 5 MB or smaller.");
  const m = await db.media.create({ data: { filename: f.name.slice(0, 200), mime: f.type, size: f.size, data: Buffer.from(await f.arrayBuffer()) } });
  return m.id;
}
async function dropMedia(id?: string | null) {
  if (id) await db.media.delete({ where: { id } }).catch(() => {});
}

function done(section: string, msg = "Saved") {
  revalidatePath("/about");
  revalidatePath("/admin/about");
  redirect(`/admin/about?ok=${encodeURIComponent(msg)}#${section}`);
}
function failed(section: string, e: unknown): never {
  if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw e;
  const msg = e instanceof UserError ? e.message : "Something went wrong while saving. Please try again.";
  if (!(e instanceof UserError)) console.error(e);
  redirect(`/admin/about?error=${encodeURIComponent(msg)}#${section}`);
}

// ---------- Intro + founder ----------
export async function saveIntro(fd: FormData) {
  try {
    const data = { intro: str(fd, "intro") || null, subIntro: str(fd, "subIntro") || null };
    await db.aboutContent.upsert({ where: { id: "about" }, create: { id: "about", ...data }, update: data });
  } catch (e) { failed("intro", e); }
  done("intro", "Introduction saved");
}

export async function saveFounder(fd: FormData) {
  try {
    const current = await db.aboutContent.findUnique({ where: { id: "about" } });
    const uploaded = await saveUpload(fd, "photo");
    const remove = fd.get("removePhoto") === "on";
    let founderPhotoId = current?.founderPhotoId ?? null;
    if (uploaded || remove) { await dropMedia(founderPhotoId); founderPhotoId = uploaded ?? null; }
    const data = {
      founderName: str(fd, "name") || null, founderRole: str(fd, "role") || null,
      founderBio: str(fd, "bio") || null, founderQuote: str(fd, "quote") || null, founderPhotoId,
    };
    await db.aboutContent.upsert({ where: { id: "about" }, create: { id: "about", ...data }, update: data });
  } catch (e) { failed("founder", e); }
  done("founder", "Founder saved");
}

// ---------- Team ----------
export async function saveMember(fd: FormData) {
  const id = str(fd, "id");
  try {
    const name = str(fd, "name");
    if (!name) throw new UserError("Each team member needs a name.");
    const uploaded = await saveUpload(fd, "photo");
    const base = { name, role: str(fd, "role") || null, bio: str(fd, "bio") || null, group: str(fd, "group") === "advisor" ? "advisor" : "team", linkedin: str(fd, "linkedin") || null, order: int(fd, "order") };
    if (id) {
      const cur = await db.teamMember.findUnique({ where: { id } });
      let photoId = cur?.photoId ?? null;
      if (uploaded || fd.get("removePhoto") === "on") { await dropMedia(photoId); photoId = uploaded ?? null; }
      await db.teamMember.update({ where: { id }, data: { ...base, photoId } });
    } else {
      await db.teamMember.create({ data: { ...base, photoId: uploaded ?? null } });
    }
  } catch (e) { failed("team", e); }
  done("team", id ? "Team member saved" : "Team member added");
}
export async function deleteMember(fd: FormData) {
  try {
    const m = await db.teamMember.delete({ where: { id: str(fd, "id") } });
    await dropMedia(m.photoId);
  } catch (e) { failed("team", e); }
  done("team", "Team member removed");
}

// ---------- Milestones ----------
export async function saveMilestone(fd: FormData) {
  const id = str(fd, "id");
  try {
    const year = str(fd, "year"), text = str(fd, "text");
    if (!year || !text) throw new UserError("A milestone needs a year and a description.");
    const data = { year, text, order: int(fd, "order") };
    if (id) await db.milestone.update({ where: { id }, data });
    else await db.milestone.create({ data });
  } catch (e) { failed("milestones", e); }
  done("milestones", id ? "Milestone saved" : "Milestone added");
}
export async function deleteMilestone(fd: FormData) {
  try { await db.milestone.delete({ where: { id: str(fd, "id") } }); } catch (e) { failed("milestones", e); }
  done("milestones", "Milestone removed");
}
/** Copies the built-in milestones into the database so they can be edited. */
export async function importDefaultMilestones(fd: FormData) {
  try {
    const rows = JSON.parse(str(fd, "rows") || "[]") as { year: string; text: string }[];
    await db.milestone.createMany({ data: rows.map((r, i) => ({ year: r.year, text: r.text, order: i })) });
  } catch (e) { failed("milestones", e); }
  done("milestones", "Milestones are now editable");
}

// ---------- Partners & press ----------
export async function savePartner(fd: FormData) {
  const id = str(fd, "id");
  try {
    const name = str(fd, "name");
    if (!name) throw new UserError("Each partner needs a name.");
    const url = str(fd, "url");
    if (url && !/^https?:\/\//i.test(url)) throw new UserError("Website links must start with https://");
    const uploaded = await saveUpload(fd, "logo");
    const base = { name, kind: str(fd, "kind") === "press" ? "press" : "partner", url: url || null, order: int(fd, "order") };
    if (id) {
      const cur = await db.partner.findUnique({ where: { id } });
      let logoId = cur?.logoId ?? null;
      if (uploaded || fd.get("removeLogo") === "on") { await dropMedia(logoId); logoId = uploaded ?? null; }
      await db.partner.update({ where: { id }, data: { ...base, logoId } });
    } else {
      await db.partner.create({ data: { ...base, logoId: uploaded ?? null } });
    }
  } catch (e) { failed("partners", e); }
  done("partners", id ? "Partner saved" : "Partner added");
}
export async function deletePartner(fd: FormData) {
  try {
    const p = await db.partner.delete({ where: { id: str(fd, "id") } });
    await dropMedia(p.logoId);
  } catch (e) { failed("partners", e); }
  done("partners", "Partner removed");
}
