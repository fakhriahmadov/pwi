import crypto from "node:crypto";
import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { fail, ok, parseBody, rateLimited } from "@/lib/http";
import { sendMail, layout } from "@/lib/email";
import { site } from "@/content/site";

const schema = z.object({ email: z.email("Please enter a valid email address."), source: z.string().max(80).optional() });

export async function POST(req: Request) {
  if (rateLimited(req)) return fail("Too many attempts. Please wait a minute.", 429);
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  if (!dbConfigured()) return fail("Subscriptions aren't open yet. Please write to info@privatewealth.institute.", 503);
  const email = data!.email.toLowerCase();
  const token = crypto.randomBytes(24).toString("base64url");
  const existing = await db.subscriber.findUnique({ where: { email } });
  if (existing?.confirmedAt && !existing.unsubscribed) return ok(); // already subscribed: don't reveal
  await db.subscriber.upsert({ where: { email }, create: { email, source: data!.source, confirmToken: token }, update: { confirmToken: token, unsubscribed: false } });
  const link = `${site.url}/api/newsletter/confirm?token=${token}`;
  await sendMail({ to: email, subject: "Confirm your subscription", html: layout("One more step.", `<p>Please confirm that you'd like to receive research, the EuroCapital Index and summit invitations from the ${site.name}.</p><p><a href="${link}" style="display:inline-block;background:#0A0A0A;color:#fff;padding:14px 22px;text-decoration:none;font-weight:bold">Confirm subscription</a></p><p style="color:#5E5A54;font-size:13px">If you didn't ask for this, ignore this email.</p>`) });
  return ok();
}
