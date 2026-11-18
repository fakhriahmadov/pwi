"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/accounts";
import { gatherNews, REGIONS, TOPICS } from "@/lib/news";

async function admin() {
  const me = await currentUser().catch(() => null);
  if (!me || me.role !== "admin") redirect("/admin/login");
  return me!;
}
const back = (fd: FormData, msg: string): never => redirect(`/admin/news?${new URLSearchParams({ ...(Object.fromEntries([...new URLSearchParams(String(fd.get("qs") || ""))])), msg })}`);
const refresh = () => { revalidatePath("/"); revalidatePath("/news"); };

/** Publish, dismiss, restore or save one item. */
async function newsAction(fd: FormData) {
  const me = await admin();
  const id = String(fd.get("id") || ""), act = String(fd.get("act") || "");
  const s = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  const topic = s("topic", 40), region = s("region", 40);
  const edits = {
    title: s("title", 300), takeaway: s("takeaway", 400) || null, figure: s("figure", 40) || null,
    ...(TOPICS.some((t) => t.key === topic) ? { topic } : {}), ...(REGIONS.some((r) => r.key === region) ? { region } : {}),
  };
  if (!edits.title) back(fd, "The headline can’t be empty.");
  if (act === "publish") await db.newsItem.update({ where: { id }, data: { ...edits, status: "published", approvedAt: new Date(), approvedBy: me.email } });
  else if (act === "save") await db.newsItem.update({ where: { id }, data: edits });
  else if (act === "dismiss") await db.newsItem.update({ where: { id }, data: { status: "dismissed" } });
  else if (act === "restore") await db.newsItem.update({ where: { id }, data: { status: "candidate", approvedAt: null } });
  refresh();
  back(fd, act === "publish" ? "Published — it’s on the homepage." : act === "dismiss" ? "Dismissed." : act === "restore" ? "Moved back to the inbox." : "Saved.");
}

/** Gather candidates now instead of waiting for tomorrow morning. */
export async function fetchNow(fd: FormData) {
  await admin();
  const r = await gatherNews();
  back(fd, r.failed === r.feeds ? "Couldn’t reach the news feeds just now. Please try again in a minute." : `${r.added} new ${r.added === 1 ? "headline" : "headlines"} in the inbox${r.failed ? ` (${r.failed} of ${r.feeds} feeds didn’t answer)` : ""}.`);
}

/* One action per button (the clicked button's value isn't reliably sent with a server-action form). */
export async function publishNews(fd: FormData) { fd.set("act", "publish"); await newsAction(fd); }
export async function saveNews(fd: FormData) { fd.set("act", "save"); await newsAction(fd); }
export async function dismissNews(fd: FormData) { fd.set("act", "dismiss"); await newsAction(fd); }
export async function restoreNews(fd: FormData) { fd.set("act", "restore"); await newsAction(fd); }
