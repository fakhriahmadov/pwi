import crypto from "node:crypto";
import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { isAdminEmail, sha256 } from "@/lib/session";
import { sendMail, layout } from "@/lib/email";
import { fail, ok, parseBody, rateLimited } from "@/lib/http";
import { site } from "@/content/site";

const schema = z.object({ email: z.email("Please enter a valid email address."), next: z.string().max(300).optional() });
const SAME = "If that address has admin access, a sign-in link is on its way. It works once and expires in 15 minutes.";

export async function POST(req: Request) {
  if (rateLimited(req, 5)) return fail("Too many attempts. Please wait a minute and try again.", 429);
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  if (!dbConfigured() || !process.env.AUTH_SECRET) return fail("Sign-in isn't configured yet (DATABASE_URL and AUTH_SECRET).", 503);
  const email = data!.email.toLowerCase();
  // Same answer whether or not the address is an admin, so nobody can probe the list.
  if (!isAdminEmail(email)) return ok({ message: SAME });

  const token = crypto.randomBytes(32).toString("base64url");
  await db.loginToken.create({ data: { email, tokenHash: await sha256(token), expiresAt: new Date(Date.now() + 15 * 60_000) } });
  const next = data!.next && data!.next.startsWith("/admin") ? data!.next : "/admin";
  const link = `${site.url}/api/auth/verify?token=${token}&next=${encodeURIComponent(next)}`;
  if (!process.env.RESEND_API_KEY) console.info(`[auth:dev] sign-in link for ${email}: ${link}`);
  await sendMail({
    to: email,
    subject: "Your admin sign-in link",
    html: layout("Sign in to the admin area.", `<p>Use this link to sign in. It works once and expires in 15 minutes.</p><p><a href="${link}" style="display:inline-block;background:#0A0A0A;color:#fff;padding:14px 22px;text-decoration:none;font-weight:bold">Sign in</a></p><p style="color:#5E5A54;font-size:13px">If you didn't ask for this, you can ignore this email — nobody can sign in without the link.</p>`),
  });
  return ok({ message: SAME });
}
