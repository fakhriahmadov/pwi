import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { getEvent, isPast } from "@/lib/events";
import { notifyTeam } from "@/lib/registrations";
import { sendMail, layout, esc } from "@/lib/email";
import { fail, ok, parseBody, rateLimited } from "@/lib/http";
import { longDate } from "@/lib/format";
import { logActivity } from "@/lib/accounts";

/** "Request an invitation" for invitation-only events: no pass, no price — every request waits for the team in Admin → Registrations. */
const schema = z.object({
  eventSlug: z.string(),
  firstName: z.string().trim().min(1, "is required").max(80),
  lastName: z.string().trim().min(1, "is required").max(80),
  email: z.email("must be a valid email address"),
  phone: z.string().max(40).optional(),
  company: z.string().max(120).optional(),
  role: z.string().max(120).optional(),
  country: z.string().max(80).optional(),
  linkedin: z.string().max(200).optional(),
  guests: z.coerce.number().int().min(1).max(4),
  message: z.string().max(2000).optional(),
  heardFrom: z.string().max(120).optional(),
  marketingOptIn: z.boolean().optional(),
  consent: z.literal(true, { message: "Please agree to the terms and privacy policy." }),
  website: z.string().max(0).optional(), // honeypot
});

export async function POST(req: Request) {
  if (rateLimited(req, 5)) return fail("Too many attempts. Please wait a minute and try again.", 429);
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const d = data!;
  const e = await getEvent(d.eventSlug);
  if (!e || isPast(e) || e.registration === "closed") return fail("Requests for this event are closed.");
  if (!dbConfigured()) return fail("Requests aren't available right now. Please write to info@privatewealth.institute.", 503);

  const email = d.email.toLowerCase();
  const already = await db.registration.findFirst({ where: { eventSlug: e.slug, email, status: { in: ["PENDING_APPROVAL", "APPROVED", "PAID"] } } });
  if (already) return fail("We already have a request from this email address for this event. Our team will be in touch.");

  const reg = await db.registration.create({
    data: {
      eventSlug: e.slug, passId: "invitation", passName: "Invitation request", quantity: d.guests, status: "PENDING_APPROVAL",
      firstName: d.firstName, lastName: d.lastName, email, phone: d.phone || null, company: d.company || null, role: d.role || null,
      country: d.country || null, linkedin: d.linkedin || null, message: d.message || null, heardFrom: d.heardFrom || null,
      marketingOptIn: Boolean(d.marketingOptIn),
    },
  });
  await logActivity(email, `Requested an invitation to ${e.series} ${e.city}${d.guests > 1 ? ` (${d.guests} people)` : ""}`);
  await notifyTeam(`New invitation request — ${e.series} ${e.city}`, {
    Name: `${d.firstName} ${d.lastName}`, Email: email, Phone: d.phone, Company: d.company, Position: d.role, Country: d.country,
    LinkedIn: d.linkedin, People: d.guests, "Why attend": d.message, "Heard from": d.heardFrom,
  });
  await sendMail({
    to: email, subject: `We've received your request — ${e.series} ${e.city}`,
    html: layout("Thank you.", `<p>Dear ${esc(d.firstName)},</p><p>We've received your request for an invitation to <b>${esc(e.series)} ${esc(e.city)}</b> on ${longDate(e.date)}. Every request is reviewed personally; our team will reply within a few working days.</p>`),
  });
  return ok({ redirect: `/events/${e.slug}/register/success?id=${reg.id}` });
}
