"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser, logActivity } from "@/lib/accounts";
import { hashPassword } from "@/lib/password";
import { isFrequency, cleanTopics, newToken, frequencyLabel, topicLabel } from "@/lib/newsletter";
import { getEvent } from "@/lib/events";

const str = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === "string" ? v.trim() : ""; };
const back = (tab: string, msg: string): never => redirect(`/account?tab=${tab}&msg=${encodeURIComponent(msg)}`);
async function me() { const u = await currentUser(); if (!u) redirect("/signin?next=/account"); return u!; }
async function myReg(id: string, email: string) {
  const r = await db.registration.findUnique({ where: { id } });
  return r && r.email.toLowerCase() === email ? r : null;
}
const eventName = async (slug: string) => { const e = await getEvent(slug, { includeDrafts: true }); return e ? `${e.series} ${e.city}` : slug; };

/** Ask for a cancellation (paid) or withdraw a pending request / enquiry. */
export async function cancelRegistration(fd: FormData) {
  const u = await me();
  const r = await myReg(str(fd, "id"), u.email);
  if (!r || r.status === "CANCELLED") back("events", "That registration can’t be changed.");
  const name = await eventName(r!.eventSlug);
  if (r!.status === "PAID" || r!.status === "APPROVED") {
    await db.registration.update({ where: { id: r!.id }, data: { requestType: "cancel", requestedAt: new Date(), transferTo: undefined } });
    await logActivity(u.email, `Requested cancellation for ${name}`);
    back("events", "Cancellation requested. The team will confirm by email.");
  }
  await db.registration.update({ where: { id: r!.id }, data: { status: "CANCELLED" } });
  await logActivity(u.email, `Withdrew the request for ${name}`);
  back("events", "Withdrawn.");
}

export async function transferRegistration(fd: FormData) {
  const u = await me();
  const r = await myReg(str(fd, "id"), u.email);
  const name = str(fd, "name"), email = str(fd, "email").toLowerCase();
  if (!r || r.status !== "PAID") back("events", "Only paid passes can be transferred.");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back("events", "Please enter your colleague’s name and a valid email address.");
  await db.registration.update({ where: { id: r!.id }, data: { requestType: "transfer", requestedAt: new Date(), transferTo: { name, email } } });
  await logActivity(u.email, `Asked to transfer the ${await eventName(r!.eventSlug)} pass to ${name}`);
  back("events", "Transfer request sent. The team will confirm by email.");
}

export async function withdrawRequest(fd: FormData) {
  const u = await me();
  const r = await myReg(str(fd, "id"), u.email);
  if (!r) back("events", "That registration can’t be changed.");
  await db.registration.update({ where: { id: r!.id }, data: { requestType: null, requestedAt: null, transferTo: undefined } });
  await logActivity(u.email, `Withdrew a request for ${await eventName(r!.eventSlug)}`);
  back("events", "Request withdrawn. Your registration is as before.");
}

/** Newsletter: subscribe / save / unsubscribe. Signed-in members are confirmed straight away (their email is verified by the account). */
export async function saveNewsletter(fd: FormData) {
  const u = await me();
  const intent = str(fd, "intent");
  const sub = await db.subscriber.findUnique({ where: { email: u.email } });
  if (intent === "unsubscribe") {
    if (sub) await db.subscriber.update({ where: { id: sub.id }, data: { unsubscribed: true } });
    await logActivity(u.email, "Unsubscribed from the newsletter");
    back("news", "You’re unsubscribed. You can subscribe again here at any time.");
  }
  const freq = isFrequency(str(fd, "frequency")) ? str(fd, "frequency") : "monthly";
  const topics = cleanTopics(fd.getAll("topics").map(String));
  if (!topics.length) back("news", "Choose at least one topic — or unsubscribe.");
  const was = sub && sub.confirmedAt && !sub.unsubscribed;
  await db.subscriber.upsert({
    where: { email: u.email },
    create: { email: u.email, name: u.name || null, frequency: freq, topics, source: "My account", confirmedAt: new Date(), manageToken: newToken() },
    update: { frequency: freq, topics, unsubscribed: false, confirmedAt: sub?.confirmedAt ?? new Date(), confirmToken: null, manageToken: sub?.manageToken ?? newToken() },
  });
  await logActivity(u.email, was ? `Changed newsletter to ${frequencyLabel(freq)} · ${topics.map(topicLabel).join(", ")}` : `Subscribed to the newsletter (${frequencyLabel(freq)})`);
  revalidatePath("/account");
  back("news", was ? "Saved." : "You’re subscribed.");
}

export async function saveProfile(fd: FormData) {
  const u = await me();
  const name = str(fd, "name");
  if (!name) back("profile", "Please enter your name.");
  await db.member.update({ where: { id: u.id }, data: { name, company: str(fd, "company") || null, title: str(fd, "title") || null, phone: str(fd, "phone") || null } });
  await logActivity(u.email, "Updated profile details");
  back("profile", "Details saved.");
}

export async function changePassword(fd: FormData) {
  const u = await me();
  const pw = String(fd.get("password") ?? "");
  if (pw.length < 10) back("profile", "Choose a password of at least 10 characters.");
  await db.member.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(pw) } });
  await logActivity(u.email, "Changed password");
  back("profile", "Password changed.");
}

export async function deleteAccount() {
  const u = await me();
  if (u.role === "admin") back("profile", "Admin accounts can’t be deleted here.");
  await db.subscriber.updateMany({ where: { email: u.email }, data: { unsubscribed: true } });
  await db.member.delete({ where: { id: u.id } });
  await db.activity.deleteMany({ where: { email: u.email } });
  redirect("/api/auth/logout-get");
}
