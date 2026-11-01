"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { buildDraft, sendEdition, isFrequency } from "@/lib/newsletter";

const str = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === "string" ? v.trim() : ""; };
const back = (freq: string, msg: string) => redirect(`/admin/newsletter?f=${freq}&msg=${encodeURIComponent(msg)}`);

/** Save subject, intro and which items to leave out — and optionally send or skip. */
export async function saveEdition(fd: FormData) {
  const freq = str(fd, "frequency");
  if (!isFrequency(freq)) return back("monthly", "Unknown newsletter.");
  const intent = str(fd, "intent"); // save | send | skip
  const by = (await headers()).get("x-admin-email");
  const d = await buildDraft(freq);
  if (d.status !== "draft") return back(freq, `This edition was already ${d.status}.`);
  const included = new Set(fd.getAll("include").map(String));
  const excluded = d.items.map((i) => i.key).filter((k) => !included.has(k));
  const data = { subject: str(fd, "subject") || d.subject, intro: str(fd, "intro") || d.intro, excluded, by };
  await db.newsletterIssue.upsert({
    where: { frequency_dueDate: { frequency: freq, dueDate: d.dueDate } },
    create: { frequency: freq, dueDate: d.dueDate, status: "draft", ...data },
    update: data,
  });
  let msg = "Saved.";
  if (intent === "skip") {
    await db.newsletterIssue.update({ where: { frequency_dueDate: { frequency: freq, dueDate: d.dueDate } }, data: { status: "skipped", sentAt: new Date() } });
    msg = `Skipped the ${d.label.toLowerCase()} edition. Its items roll into the next one.`;
  } else if (intent === "send") {
    if (d.items.length === excluded.length) return back(freq, "Nothing to send: include at least one item, or skip this edition.");
    try {
      const { sent } = await sendEdition(freq, by);
      msg = `Sent to ${sent} subscriber${sent === 1 ? "" : "s"}.`;
    } catch (e) { msg = e instanceof Error ? e.message : "Sending failed."; }
  }
  revalidatePath("/admin/newsletter");
  return back(freq, msg);
}
