import { NextResponse } from "next/server";
import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { isAdminEmail } from "@/lib/session";
import { verifyPassword, hashPassword } from "@/lib/password";
import { withSession, safeNext } from "@/lib/auth-response";
import { fail, parseBody, rateLimited } from "@/lib/http";

const schema = z.object({ email: z.email("Please enter a valid email address."), password: z.string().min(1, "Please enter your password.").max(200), next: z.string().max(300).optional() });
const WRONG = "That email and password don't match. Try again, or use “Forgot password”.";
let dummy: string | null = null; // keeps timing similar for unknown addresses

export async function POST(req: Request) {
  if (rateLimited(req, 6)) return fail("Too many attempts. Please wait a minute and try again.", 429);
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  if (!dbConfigured() || !process.env.AUTH_SECRET) return fail("Sign-in isn't configured yet (DATABASE_URL and AUTH_SECRET).", 503);
  const email = data!.email.toLowerCase();
  const user = isAdminEmail(email) ? await db.adminUser.findUnique({ where: { email } }) : null;
  dummy ??= await hashPassword("not-a-real-password");
  const okPw = await verifyPassword(data!.password, user?.passwordHash ?? dummy);
  if (!user || !okPw) return fail(WRONG, 401);
  return withSession(NextResponse.json({ ok: true, redirect: safeNext(data!.next) }), email, req);
}
