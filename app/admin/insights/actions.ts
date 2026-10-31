"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { slugify } from "@/lib/markdown";
import { storeImage, deleteImage, UploadError } from "@/lib/media";
import { getFileArticles } from "@/lib/articles";

const str = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === "string" ? v.trim() : ""; };

function refresh(slugs: string[] = []) {
  for (const p of ["/", "/insights", "/admin/insights", "/sitemap.xml", "/insights/rss.xml"]) revalidatePath(p);
  revalidatePath("/insights/topic/[topic]", "page");
  for (const s of slugs) revalidatePath(`/insights/${s}`);
}

export async function saveArticle(fd: FormData) {
  const id = str(fd, "id");
  const intent = str(fd, "intent"); // draft | publish | save
  let savedId = id;
  let error = "";
  try {
    const title = str(fd, "title");
    if (!title) throw new UploadError("Please give the article a title.");
    const date = str(fd, "date");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new UploadError("Please choose a publication date.");
    const topic = str(fd, "topicNew") || str(fd, "topic") || "Insights";
    let slug = slugify(str(fd, "slug") || title);
    if (!slug) throw new UploadError("The web address needs at least one letter or number.");
    const clash = await db.article.findUnique({ where: { slug } });
    if (clash && clash.id !== id) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const current = id ? await db.article.findUnique({ where: { id } }) : null;
    const uploaded = await storeImage(fd.get("cover"));
    let coverId = current?.coverId ?? null;
    if (uploaded || fd.get("removeCover") === "on") { await deleteImage(coverId); coverId = uploaded ?? null; }

    const status = intent === "publish" ? "published" : intent === "draft" ? "draft" : current?.status ?? "draft";
    const featured = fd.get("featured") === "on";
    const data = { slug, title, excerpt: str(fd, "excerpt"), topic, author: str(fd, "author") || "Fakhri Ahmadov", date, body: str(fd, "body"), coverId, status, featured };
    if (featured) await db.article.updateMany({ where: { featured: true, NOT: id ? { id } : undefined }, data: { featured: false } });
    const saved = current ? await db.article.update({ where: { id }, data }) : await db.article.create({ data });
    savedId = saved.id;
    refresh([saved.slug, current?.slug ?? ""].filter(Boolean));
  } catch (e) {
    if (!(e instanceof UploadError)) console.error(e);
    error = e instanceof UploadError ? e.message : "Something went wrong while saving. Please try again.";
  }
  if (error) redirect(`/admin/insights/${id || "new"}?error=${encodeURIComponent(error)}`);
  const msg = intent === "publish" ? "Published" : intent === "draft" ? "Saved as draft" : "Saved";
  redirect(`/admin/insights/${savedId}?ok=${encodeURIComponent(msg)}`);
}

export async function deleteArticle(fd: FormData) {
  const a = await db.article.delete({ where: { id: str(fd, "id") } }).catch(() => null);
  if (a) { await deleteImage(a.coverId); refresh([a.slug]); }
  redirect(`/admin/insights?ok=${encodeURIComponent("Article deleted")}`);
}

/** Copies the original Markdown-file articles into the database so they can be edited. */
export async function importFileArticles() {
  const existing = new Set((await db.article.findMany({ select: { slug: true } })).map((a) => a.slug));
  const toAdd = getFileArticles().filter((f) => !existing.has(f.slug));
  for (const f of toAdd)
    await db.article.create({ data: { slug: f.slug, legacySlug: f.legacySlug, title: f.title, excerpt: f.excerpt, topic: f.topic, author: f.author, date: f.date, body: f.body, status: "published" } });
  refresh(toAdd.map((f) => f.slug));
  redirect(`/admin/insights?ok=${encodeURIComponent(`${toAdd.length} articles are now editable`)}`);
}
