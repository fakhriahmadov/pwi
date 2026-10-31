import Link from "next/link";
import type { Metadata } from "next";
import { getEvent } from "@/lib/events";
import { db, dbConfigured } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { issueTicket } from "@/lib/registrations";
import { longDate } from "@/lib/format";

export const metadata: Metadata = { title: "Registration received", robots: { index: false } };
export const dynamic = "force-dynamic";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ session_id?: string; id?: string }> };

export default async function Success({ params, searchParams }: P) {
  const e = getEvent((await params).slug);
  const sp = await searchParams;
  let paid = false, personal = Boolean(sp.id), code: string | null = null;
  if (sp.session_id && dbConfigured()) {
    // Confirm with Stripe directly in case the webhook hasn't arrived yet.
    const s = stripe();
    const session = s ? await s.checkout.sessions.retrieve(sp.session_id).catch(() => null) : null;
    const regId = session?.metadata?.registrationId;
    if (session?.payment_status === "paid" && regId) {
      const reg = await issueTicket(regId);
      paid = true; code = reg?.ticketCode ?? null;
    }
  }
  if (sp.id && dbConfigured()) {
    const reg = await db.registration.findUnique({ where: { id: sp.id } }).catch(() => null);
    personal = Boolean(reg);
  }
  return (
    <section className="paper">
      <div className="wrap stack" style={{ ["--g" as string]: "20px", maxWidth: 880 }}>
        <span style={{ width: 64, height: 64, background: e?.accent || "var(--black)", color: e?.onAccent || "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
        </span>
        <h1 className="h2-big">{paid ? "You're registered" : personal ? "Request received" : "Thank you"}<span className="dot">.</span></h1>
        <p style={{ color: "var(--ink)", maxWidth: "56ch" }}>
          {paid ? `Your e-ticket with QR code is on its way by email. See you in ${e?.city} on ${e ? longDate(e.date) : ""}.`
            : personal ? "Our team will be in touch personally within a few working days."
            : "If your payment went through, your e-ticket will arrive by email in a few minutes."}
        </p>
        <div className="row">
          {code && <Link className="btn btn-dark" href={`/tickets/${code}`}>View ticket</Link>}
          {e && <a className="btn btn-ghost" href={`/events/${e.slug}/calendar.ics`}>Add to calendar</a>}
          {e && <Link className="btn btn-ghost" href={`/events/${e.slug}`}>Back to programme</Link>}
        </div>
      </div>
    </section>
  );
}
