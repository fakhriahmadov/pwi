"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { importTable, normTag, STARTER_INDEXES, FIELDS, type Mapping, type Unit } from "@/lib/indexes";
import { readTable } from "@/lib/sheets";
import { slugify } from "@/lib/markdown";

const str = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === "string" ? v.trim() : ""; };
const refresh = () => { revalidatePath("/"); revalidatePath("/insights"); revalidatePath("/indexes/[slug]", "page"); revalidatePath("/admin/research"); };
const back = (q: string, hash = "") => redirect(`/admin/research?${q}${hash}`);

/** Step 1: store the uploaded spreadsheet and go to the column-matching screen. */
export async function uploadData(fd: FormData) {
  const f = fd.get("file");
  if (!f || typeof f === "string" || f.size === 0) back(`error=${encodeURIComponent("Please choose a spreadsheet (.xlsx or .csv).")}`, "#data");
  const file = f as File;
  if (!/\.(xlsx|csv)$/i.test(file.name)) back(`error=${encodeURIComponent(/\.xls$/i.test(file.name) ? "This is an old Excel file (.xls). In Excel choose File → Save As → Excel Workbook (.xlsx), then upload that." : "Please upload an Excel (.xlsx) or CSV file.")}`, "#data");
  if (file.size > 20 * 1024 * 1024) back(`error=${encodeURIComponent("The file is larger than 20 MB. Split it by year and upload each part.")}`, "#data");
  const by = (await headers()).get("x-admin-email") ?? undefined;
  await db.pendingUpload.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 864e5) } } });
  const p = await db.pendingUpload.create({ data: { filename: file.name, data: Buffer.from(await file.arrayBuffer()), by } });
  redirect(`/admin/research/import/${p.id}`);
}

/** Step 2: import with the columns the admin matched. */
export async function confirmImport(fd: FormData) {
  const id = str(fd, "id");
  const p = await db.pendingUpload.findUnique({ where: { id } });
  if (!p) back(`error=${encodeURIComponent("That upload has expired. Please upload the file again.")}`, "#data");
  const mapping: Mapping = {};
  for (const f of FIELDS) { const v = str(fd, `map_${f.key}`); if (v !== "") mapping[f.key] = Number(v); }
  const unit = (["bn", "m", "eur"].includes(str(fd, "unit")) ? str(fd, "unit") : "bn") as Unit;
  const tagColumns = fd.getAll("tagColumns").map((v) => Number(v)).filter((n) => Number.isInteger(n));
  let r;
  try { r = await importTable(await readTable(Buffer.from(p!.data), p!.filename), mapping, { filename: p!.filename, by: p!.by ?? undefined, unit, tagColumns }); }
  catch (e) { console.error(e); redirect(`/admin/research/import/${id}?error=${encodeURIComponent("The file couldn't be read. Please check it opens in Excel and try again.")}`); }
  if (!r!.ok) redirect(`/admin/research/import/${id}?error=${encodeURIComponent(r!.errors.join("\n"))}`);
  await db.pendingUpload.delete({ where: { id } }).catch(() => {});
  refresh();
  back(`ok=${encodeURIComponent(`Imported ${r!.rows.toLocaleString("en")} rows for ${r!.years.join(", ")}. All indexes are recalculated`)}`, "#data");
}

export async function cancelImport(fd: FormData) {
  await db.pendingUpload.delete({ where: { id: str(fd, "id") } }).catch(() => {});
  back("", "#data");
}

export async function deleteYear(fd: FormData) {
  const year = Number(str(fd, "year"));
  await db.fortune.deleteMany({ where: { year } });
  refresh();
  back(`ok=${encodeURIComponent(`Removed all data for ${year}`)}`, "#data");
}

export async function createStarters() {
  for (const s of STARTER_INDEXES) {
    const exists = await db.indexDef.findUnique({ where: { slug: s.slug } });
    if (!exists) await db.indexDef.create({ data: { ...s, published: false, order: STARTER_INDEXES.indexOf(s) } });
  }
  refresh();
  back(`ok=${encodeURIComponent("Starter indexes created as drafts — review each one and publish it")}`, "#indexes");
}

const tagList = (fd: FormData, k: string) => Array.from(new Set(fd.getAll(k).map((v) => normTag(String(v))).filter(Boolean)));

export async function saveIndex(fd: FormData) {
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) redirect(`/admin/research/${id || "new"}?error=${encodeURIComponent("Please give the index a name.")}`);
  let slug = slugify(str(fd, "slug") || name);
  const clash = await db.indexDef.findUnique({ where: { slug } });
  if (clash && clash.id !== id) slug = `${slug}-${Date.now().toString(36).slice(-3)}`;
  const color = /^#[0-9a-f]{6}$/i.test(str(fd, "color")) ? str(fd, "color") : "#C42F33";
  const baseYear = Number.parseInt(str(fd, "baseYear"), 10) || null;
  const data = {
    name, slug, description: str(fd, "description"), color, baseYear,
    allTags: tagList(fd, "allTags"), anyTags: tagList(fd, "anyTags"),
    published: fd.get("published") === "on", featured: fd.get("featured") === "on",
    order: Number.parseInt(str(fd, "order"), 10) || 0,
  };
  if (data.featured) await db.indexDef.updateMany({ where: { featured: true, NOT: id ? { id } : undefined }, data: { featured: false } });
  const saved = id ? await db.indexDef.update({ where: { id }, data }) : await db.indexDef.create({ data });
  refresh();
  redirect(`/admin/research/${saved.id}?ok=${encodeURIComponent(saved.published ? "Saved. The index is live on the Indexes page" : "Saved as a draft")}`);
}

export async function deleteIndex(fd: FormData) {
  await db.indexDef.delete({ where: { id: str(fd, "id") } }).catch(() => {});
  refresh();
  back(`ok=${encodeURIComponent("Index removed")}`, "#indexes");
}
