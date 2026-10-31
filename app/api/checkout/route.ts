import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { getEvent, getPass, isPast } from "@/lib/events";
import { createCheckout, notifyTeam } from "@/lib/registrations";
import { sendMail, layout, esc } from "@/lib/email";
import { fail, ok, parseBody, rateLimited } from "@/lib/http";
import { longDate } from "@/lib/format";

const schema = z.object({
  eventSlug: z.string(),
  passId: z.string(),
  quantity: z.coerce.number().int().min(1).max(10),
  firstName: z.string().min(1, "is required").max(80),
  lastName: z.string().min(1, "is required").max(80),
  email: z.email("must be a valid email address"),
  phone: z.string().max(40).optional(),
  company: z.string().max(120).optional(),
  role: z.string().max(120).optional(),
  heardFrom: z.string().max(120).optional(),
  vatNumber: z.string().max(40).optional(),
  invoiceCompany: z.string().max(160).optional(),
  marketingOptIn: z.boolean().optional(),
  terms: z.literal(true, { message: "Please accept the terms of registration." }),
});

export async function POST(req: Request) {
  if (rateLimited(req, 6)) return fail("Too many attempts. Please wait a minute and try again.", 429);
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const d = data!;
  const e = getEvent(d.eventSlug);
  if (!e || isPast(e) || e.registration === "closed") return fail("Registration for this event is closed.");
  if (e.externalRegistrationUrl) return fail("Registration for this event runs on our previous booking page.");
  const pass = getPass(e, d.passId);
  if (!pass) return fail("Please choose a pass.");
  if (!dbConfigured()) return fail("Registration isn't available right now. Please write to info@privatewealth.institute.", 503);

  const base = {
    eventSlug: e.slug, passId: pass.id, passName: pass.name, quantity: d.quantity,
    firstName: d.firstName, lastName: d.lastName, email: d.email.toLowerCase(), phone: d.phone, company: d.company,
    role: d.role, heardFrom: d.heardFrom, vatNumber: d.vatNumber, invoiceCompany: d.invoiceCompany, marketingOptIn: Boolean(d.marketingOptIn),
  };

  // Personal follow-up: "on request" passes and invite-only events
  if (pass.onRequest || e.registration === "approval") {
    const status = pass.onRequest ? "ENQUIRY" : "PENDING_APPROVAL";
    const reg = await db.registration.create({ data: { ...base, status } });
    await notifyTeam(`New ${pass.onRequest ? "partner / group enquiry" : "registration to approve"} — ${e.city}`, { Name: `${d.firstName} ${d.lastName}`, Email: d.email, Company: d.company, Pass: pass.name, Guests: d.quantity });
    await sendMail({ to: base.email, subject: `We've received your registration — ${e.series} ${e.city}`, html: layout("Thank you.", `<p>Dear ${esc(d.firstName)},</p><p>We've received your request for <b>${esc(pass.name)}</b> at ${esc(e.series)} ${esc(e.city)} on ${longDate(e.date)}. Our team will be in touch personally within a few working days.</p>`) });
    return ok({ redirect: `/events/${e.slug}/register/success?id=${reg.id}` });
  }

  if (pass.priceCents == null) return fail("Prices for this pass haven't been announced yet. Please check back soon or contact us.");

  const reg = await db.registration.create({ data: { ...base, status: "PENDING_PAYMENT" } });
  try {
    const url = await createCheckout(reg, pass.priceCents);
    return ok({ redirect: url });
  } catch (err) {
    if ((err as Error).message === "STRIPE_NOT_CONFIGURED") return fail("Online payment isn't set up yet. Please write to info@privatewealth.institute to register.", 503);
    console.error(err);
    return fail("We couldn't start the payment. Please try again in a moment.", 502);
  }
}
