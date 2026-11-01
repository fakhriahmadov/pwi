import crypto from "node:crypto";
import { db, dbConfigured } from "./db";
import { getArticles } from "./articles";
import { allEvents } from "./events";
import { getPublishedIndexes, featuredIndex, fmtLevel, fmtPct } from "./research";
import { longDate } from "./format";
import { sendMail, layout, esc } from "./email";
import { site } from "@/content/site";

/**
 * The newsletter: one digest per frequency. Subscribers choose how often (weekly → annually) and
 * what to include (insights and/or events). Event news only ever goes out inside these digests —
 * never as separate invitations. Every edition waits for an admin to approve (send) or skip it.
 */

import { FREQUENCIES, TOPICS, frequencyLabel, topicLabel, type Frequency, type Topic } from "./newsletter-options";
export { FREQUENCIES, TOPICS, frequencyLabel, topicLabel, type Frequency, type Topic };

export const isFrequency = (s: unknown): s is Frequency => FREQUENCIES.some((f) => f.id === s);
export const cleanTopics = (list: unknown): Topic[] =>
  Array.isArray(list) ? TOPICS.map((t) => t.id).filter((id) => list.includes(id)) : [];
export const newToken = () => crypto.randomBytes(24).toString("base64url");

// ---------- Schedule ----------
const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
export const todayISO = () => iso(new Date());

/** The edition due most recently (on or before `today`) for a frequency. */
export function currentDue(freq: Frequency, today = todayISO()): string {
  const [y, m, d] = today.split("-").map(Number);
  const t = utc(y, m - 1, d);
  if (freq === "weekly") { const back = (t.getUTCDay() + 6) % 7; return iso(utc(y, m - 1, d - back)); } // Monday
  if (freq === "monthly") return iso(utc(y, m - 1, 1));
  if (freq === "quarterly") return iso(utc(y, Math.floor((m - 1) / 3) * 3, 1));
  return today >= `${y}-12-15` ? `${y}-12-15` : `${y - 1}-12-15`;
}

/** The edition after a given due date. */
export function nextDue(freq: Frequency, due: string): string {
  const [y, m, d] = due.split("-").map(Number);
  if (freq === "weekly") return iso(utc(y, m - 1, d + 7));
  if (freq === "monthly") return iso(utc(y, m, 1));
  if (freq === "quarterly") return iso(utc(y, m + 2, 1));
  return `${y + 1}-12-15`;
}

/** The edition before a given due date (used as the "since" date when nothing was sent yet). */
function previousDue(freq: Frequency, due: string): string {
  const [y, m, d] = due.split("-").map(Number);
  if (freq === "weekly") return iso(utc(y, m - 1, d - 7));
  if (freq === "monthly") return iso(utc(y, m - 2, 1));
  if (freq === "quarterly") return iso(utc(y, m - 4, 1));
  return `${y - 1}-12-15`;
}

// ---------- Building an edition ----------
export type Item = { key: string; topic: Topic; label: string; title: string; sub: string; text: string; url: string };

export type Draft = {
  frequency: Frequency; label: string; dueDate: string; since: string; nextDate: string;
  status: "draft" | "sent" | "skipped"; sentAt?: Date | null; recipients: number;
  subject: string; intro: string; items: Item[]; excluded: string[]; issueId?: string;
};

/** Everything that would go into the current edition for a frequency, with any saved admin edits. */
export async function buildDraft(freq: Frequency, today = todayISO()): Promise<Draft> {
  const dueDate = currentDue(freq, today);
  const label = frequencyLabel(freq);
  const issue = dbConfigured() ? await db.newsletterIssue.findUnique({ where: { frequency_dueDate: { frequency: freq, dueDate } } }).catch(() => null) : null;
  const lastSent = dbConfigured()
    ? await db.newsletterIssue.findFirst({ where: { frequency: freq, status: { in: ["sent", "skipped"] }, dueDate: { lt: dueDate } }, orderBy: { dueDate: "desc" } }).catch(() => null)
    : null;
  const since = lastSent?.dueDate ?? previousDue(freq, dueDate);

  const items: Item[] = [];
  if (issue?.status === "sent" && Array.isArray(issue.items)) {
    items.push(...(issue.items as unknown as Item[]));
  } else {
    for (const a of await getArticles())
      if (a.date > since && a.date <= today)
        items.push({ key: `article:${a.slug}`, topic: "insights", label: "Article", title: a.title, sub: `${a.topic} · ${longDate(a.date)}`, text: a.excerpt, url: `${site.url}/insights/${a.slug}` });

    const lastUpload = dbConfigured() ? await db.dataUpload.findFirst({ orderBy: { createdAt: "desc" } }).catch(() => null) : null;
    if (lastUpload && iso(lastUpload.createdAt) > since) {
      const idx = await getPublishedIndexes();
      const f = featuredIndex(idx);
      if (f?.result.latest)
        items.push({ key: `indexes:${iso(lastUpload.createdAt)}`, topic: "insights", label: "Index update", title: `Index levels for ${f.result.latest.year}`,
          sub: `${idx.length} indexes · latest figures`,
          text: `The ${f.name} stands at ${fmtLevel(f.result.latest.level)} (${f.result.baseYear} = 100), ${fmtPct(f.result.changePct)} on the year.`,
          url: `${site.url}/insights#indexes` });
    }

    const events = await allEvents();
    for (const e of events.filter((e) => e.date >= today && e.registration !== "closed"))
      items.push({ key: `event:${e.slug}`, topic: "events", label: "Upcoming event", title: `${e.series} ${e.city}`, sub: `${longDate(e.date)} · ${e.venue || "Venue to be announced"}`, text: e.description, url: `${site.url}/events/${e.slug}` });
    if (freq === "annually")
      for (const e of events.filter((e) => e.date < today && e.date > since))
        items.push({ key: `past:${e.slug}`, topic: "events", label: "Year in review", title: `${e.series} ${e.city}`, sub: longDate(e.date), text: e.description, url: `${site.url}/events/${e.slug}` });
  }

  const recipients = dbConfigured() ? await db.subscriber.count({ where: { frequency: freq, confirmedAt: { not: null }, unsubscribed: false } }).catch(() => 0) : 0;
  return {
    frequency: freq, label, dueDate, since, nextDate: nextDue(freq, dueDate),
    status: (issue?.status as Draft["status"]) ?? "draft", sentAt: issue?.sentAt, recipients: issue?.status === "sent" ? issue.recipients : recipients,
    subject: issue?.subject || `The ${label.toLowerCase()} briefing · ${longDate(dueDate)}`,
    intro: issue?.intro || (freq === "annually" ? "A year of research and summits, in one email." : `What’s new from the ${site.name} since our last note.`),
    items, excluded: issue?.excluded ?? [], issueId: issue?.id,
  };
}

// ---------- Email ----------
const btn = (href: string, text: string) => `<a href="${href}" style="display:inline-block;background:#0A0A0A;color:#fff;padding:12px 20px;text-decoration:none;font-weight:bold;font-size:13px">${esc(text)}</a>`;

export const manageUrl = (token: string) => `${site.url}/newsletter/preferences?token=${encodeURIComponent(token)}`;
export const unsubscribeUrl = (token: string) => `${site.url}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;

/** The digest as one subscriber receives it: only their topics, with their own manage/unsubscribe links. */
export function renderDigest(d: Pick<Draft, "subject" | "intro" | "label">, items: Item[], token = "preview") {
  const groups: [Topic, string][] = [["insights", "Insights & research"], ["events", "Upcoming events"]];
  const body = groups.map(([t, title]) => {
    const list = items.filter((i) => i.topic === t);
    if (!list.length) return "";
    return `<h2 style="margin:28px 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#C42F33">${esc(title)}</h2>` +
      list.map((i) => `<div style="padding:16px 0;border-top:1px solid #E3DCCF"><div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5E5A54">${esc(i.label)}</div>
<div style="font-size:19px;font-weight:bold;margin:4px 0"><a href="${i.url}" style="color:#0A0A0A;text-decoration:none">${esc(i.title)}</a></div>
<div style="font-size:13px;color:#5E5A54">${esc(i.sub)}</div>${i.text ? `<p style="margin:8px 0 0">${esc(i.text)}</p>` : ""}</div>`).join("");
  }).join("");
  const foot = `<p style="margin-top:32px;font-size:12px;color:#5E5A54">You receive the ${esc(d.label.toLowerCase())} briefing. <a href="${manageUrl(token)}" style="color:#5E5A54">Change frequency or topics</a> · <a href="${unsubscribeUrl(token)}" style="color:#5E5A54">Unsubscribe</a></p>`;
  return layout(d.subject, `<p>${esc(d.intro)}</p>${body}${foot}`);
}

/** Confirmation email after signing up (double opt-in). */
export async function sendConfirmation(email: string, token: string, freq: Frequency, topics: Topic[]) {
  const link = `${site.url}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;
  await sendMail({
    to: email, subject: "Confirm your subscription",
    html: layout("One more step.", `<p>Please confirm that you’d like the <b>${esc(frequencyLabel(freq).toLowerCase())}</b> briefing from the ${esc(site.name)}, with ${esc(topics.map(topicLabel).join(" and ").toLowerCase())}.</p><p>${btn(link, "Confirm subscription")}</p><p style="color:#5E5A54;font-size:13px">If you didn’t ask for this, ignore this email — you won’t hear from us.</p>`),
  });
}

/** Sends the current edition of one frequency to every confirmed subscriber of it. */
export async function sendEdition(freq: Frequency, by: string | null): Promise<{ sent: number }> {
  const d = await buildDraft(freq);
  if (d.status !== "draft") throw new Error("This edition has already been " + d.status + ".");
  const items = d.items.filter((i) => !d.excluded.includes(i.key));
  const subs = await db.subscriber.findMany({ where: { frequency: freq, confirmedAt: { not: null }, unsubscribed: false } });
  let sent = 0;
  for (const s of subs) {
    const mine = items.filter((i) => s.topics.includes(i.topic));
    if (!mine.length) continue;
    let token = s.manageToken;
    if (!token) { token = newToken(); await db.subscriber.update({ where: { id: s.id }, data: { manageToken: token } }); }
    await sendMail({ to: s.email, subject: d.subject, html: renderDigest(d, mine, token), headers: { "List-Unsubscribe": `<${unsubscribeUrl(token)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
    sent++;
  }
  await db.newsletterIssue.upsert({
    where: { frequency_dueDate: { frequency: freq, dueDate: d.dueDate } },
    create: { frequency: freq, dueDate: d.dueDate, status: "sent", subject: d.subject, intro: d.intro, excluded: d.excluded, items: items as object[], recipients: sent, sentAt: new Date(), by },
    update: { status: "sent", items: items as object[], recipients: sent, sentAt: new Date(), by },
  });
  return { sent };
}
