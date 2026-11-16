import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { isAdminEmail } from "@/lib/session";
import { verifyPassword, hashPassword } from "@/lib/password";
import { withSession, safeNext } from "@/lib/auth-response";
import { ensureMember, roleOf } from "@/lib/accounts";
import { fail, parseBody, rateLimited } from "@/lib/http";

const schema = z.object({ email: z.email("Please enter a valid email address."), password: z.string().min(1, "Please enter your password.").max(200), next: z.string().max(300).optional() });
const WRONG = "That email and password don't match. Try again, or email yourself a sign-in link.";
let dummy: string | null = null; // keeps timing similar for unknown addresses

/** Email + password sign-in for members and admins. */
export async function POST(req: Request) {
  if (rateLimited(req, 6)) return fail("Too many attempts. Please wait a minute and try again.", 429);
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  if (!dbConfigured() || !process.env.AUTH_SECRET) return fail("Sign-in isn't configured yet (DATABASE_URL and AUTH_SECRET).", 503);
  const email = data!.email.toLowerCase();
  const member = await ensureMember(email);
  if (member && member.status !== "active") return fail("This account is disabled. Write to info@privatewealth.institute.", 403);
  // Admins may still have their password in the older AdminUser table.
  const legacy = !member?.passwordHash && isAdminEmail(email) ? await db.adminUser.findUnique({ where: { email } }) : null;
  let stored = member?.passwordHash ?? legacy?.passwordHash ?? null;

  // First admin sign-in without email: ADMIN_FIRST_PASSWORD (hosting setting), once per admin address with no password yet.
  const first = process.env.ADMIN_FIRST_PASSWORD || "";
  if (!stored && member && isAdminEmail(email) && first.length >= 12) {
    const a = crypto.createHash("sha256").update(data!.password).digest(), b = crypto.createHash("sha256").update(first).digest();
    if (crypto.timingSafeEqual(a, b)) {
      stored = await hashPassword(first);
      await db.member.update({ where: { id: member.id }, data: { passwordHash: stored } });
      return withSession(NextResponse.json({ ok: true, redirect: "/account?tab=profile&setup=1" }), email, req, "admin");
    }
  }
  dummy ??= await hashPassword("not-a-real-password");
  const okPw = await verifyPassword(data!.password, stored ?? dummy);
  if (!member || !stored || !okPw) return fail(WRONG, 401);
  if (legacy && !member.passwordHash) await db.member.update({ where: { id: member.id }, data: { passwordHash: legacy.passwordHash } });
  await db.member.update({ where: { id: member.id }, data: { lastSignIn: new Date(), method: "password" } });
  const role = roleOf(member);
  return withSession(NextResponse.json({ ok: true, redirect: safeNext(data!.next, role) }), email, req, role);
}
