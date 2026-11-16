import { NextResponse } from "next/server";
import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { withSession } from "@/lib/auth-response";
import { isAdminEmail } from "@/lib/session";
import { logActivity } from "@/lib/accounts";
import { fail, parseBody, rateLimited } from "@/lib/http";
import { newToken, sendConfirmation } from "@/lib/newsletter";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.email("Please enter a valid email address."),
  password: z.string().min(10, "Choose a password of at least 10 characters.").max(200),
  newsletter: z.boolean().optional(),
});

/** Create a member account. Admin addresses can't be claimed this way (they sign in with the admin password or a link). */
export async function POST(req: Request) {
  if (rateLimited(req, 5)) return fail("Too many attempts. Please wait a minute and try again.", 429);
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  if (!dbConfigured() || !process.env.AUTH_SECRET) return fail("Accounts aren't available yet.", 503);
  const email = data!.email.toLowerCase();
  if (isAdminEmail(email)) return fail("This address already has an account. Sign in instead.", 409);
  const exists = await db.member.findUnique({ where: { email } });
  if (exists) return fail("There’s already an account for this address. Sign in instead, or email yourself a sign-in link.", 409);
  await db.member.create({ data: { email, name: data!.name, passwordHash: await hashPassword(data!.password), method: "password", lastSignIn: new Date() } });
  await logActivity(email, "Created an account");
  if (data!.newsletter) {
    const sub = await db.subscriber.findUnique({ where: { email } });
    if (!sub?.confirmedAt || sub.unsubscribed) {
      const token = newToken();
      await db.subscriber.upsert({ where: { email }, create: { email, name: data!.name, frequency: "monthly", topics: ["insights", "events"], source: "Account sign-up", confirmToken: token }, update: { confirmToken: token, unsubscribed: false } });
      await sendConfirmation(email, token, "monthly", ["insights", "events"]);
      await logActivity(email, "Asked for the monthly newsletter (confirmation email sent)");
    }
  }
  return withSession(NextResponse.json({ ok: true, redirect: "/account" }), email, req, "member");
}
