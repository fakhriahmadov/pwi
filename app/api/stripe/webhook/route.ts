import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { issueTicket } from "@/lib/registrations";

export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return new Response("Stripe not configured", { status: 503 });
  const sig = req.headers.get("stripe-signature") || "";
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      const id = session.metadata?.registrationId || session.client_reference_id;
      if (id) {
        if (session.amount_total != null) await db.registration.update({ where: { id }, data: { amountCents: session.amount_total } }).catch(() => {});
        await issueTicket(id);
      }
    }
  }
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const id = session.metadata?.registrationId;
    if (id) await db.registration.updateMany({ where: { id, status: "PENDING_PAYMENT" }, data: { status: "CANCELLED" } });
  }
  return new Response("ok");
}
