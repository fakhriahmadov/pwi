import crypto from "node:crypto";
import QRCode from "qrcode";
import type { Registration } from "@prisma/client";
import { db } from "./db";
import { sendMail, layout, esc, inbox } from "./email";
import { getEvent, formatEuro } from "./events";
import { longDate } from "./format";
import { site } from "@/content/site";
import { stripe } from "./stripe";

export const newTicketCode = () => crypto.randomBytes(6).toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "X");

/** Creates a Stripe Checkout session for a registration and stores its id. */
export async function createCheckout(reg: Registration, unitCents: number) {
  const s = stripe();
  if (!s) throw new Error("STRIPE_NOT_CONFIGURED");
  const e = (await getEvent(reg.eventSlug, { includeDrafts: true }))!;
  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer_email: reg.email,
    client_reference_id: reg.id,
    metadata: { registrationId: reg.id, eventSlug: reg.eventSlug },
    line_items: [{ quantity: reg.quantity, price_data: { currency: "eur", unit_amount: unitCents, product_data: { name: `${e.series} ${e.city} — ${reg.passName}`, description: `${longDate(e.date)} · ${e.venue}` } } }],
    invoice_creation: { enabled: true },
    tax_id_collection: { enabled: true },
    success_url: `${site.url}/events/${e.slug}/register/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site.url}/events/${e.slug}/register?pass=${reg.passId}&cancelled=1`,
  });
  await db.registration.update({ where: { id: reg.id }, data: { stripeSessionId: session.id, amountCents: unitCents * reg.quantity } });
  return session.url!;
}

/** Marks a registration paid, issues a ticket code and emails the e-ticket. Safe to call twice. */
export async function issueTicket(regId: string) {
  const reg = await db.registration.findUnique({ where: { id: regId } });
  if (!reg || reg.status === "PAID") return reg;
  const updated = await db.registration.update({ where: { id: regId }, data: { status: "PAID", ticketCode: reg.ticketCode ?? newTicketCode() } });
  await sendTicketEmail(updated);
  return updated;
}

export async function sendTicketEmail(reg: Registration) {
  const e = await getEvent(reg.eventSlug, { includeDrafts: true });
  if (!e || !reg.ticketCode) return;
  const ticketUrl = `${site.url}/tickets/${reg.ticketCode}`;
  const png = await QRCode.toBuffer(ticketUrl, { width: 480, margin: 1 });
  await sendMail({
    to: reg.email,
    subject: `Your ticket — ${e.series} ${e.city}`,
    html: layout(`You're registered for ${e.city}.`, `
      <p>Dear ${esc(reg.firstName)},</p>
      <p>Thank you for registering for <b>${esc(e.series)} ${esc(e.city)}</b> on <b>${longDate(e.date)}</b> at ${esc(e.venue)}, ${esc(e.address)}.</p>
      <p><b>Pass:</b> ${esc(reg.passName)} × ${reg.quantity}${reg.amountCents ? ` · ${formatEuro(reg.amountCents)}` : ""}<br><b>Ticket code:</b> ${reg.ticketCode}</p>
      <p>Show the attached QR code at the entrance, or open your ticket here:<br><a href="${ticketUrl}">${ticketUrl}</a></p>
      <p><a href="${site.url}/events/${e.slug}/calendar.ics">Add to your calendar</a></p>`),
    attachments: [{ filename: `ticket-${reg.ticketCode}.png`, content: png }],
  });
}

export async function notifyTeam(subject: string, rows: Record<string, unknown>) {
  const body = Object.entries(rows).filter(([, v]) => v !== undefined && v !== "" && v !== null)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5E5A54">${esc(k)}</td><td>${esc(String(v))}</td></tr>`).join("");
  await sendMail({ to: inbox(), subject, html: layout(subject, `<table>${body}</table><p><a href="${site.url}/admin">Open admin</a></p>`) });
}
