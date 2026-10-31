import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, isAdminEmail, sha256, SESSION_COOKIE, SESSION_DAYS } from "@/lib/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const next = url.searchParams.get("next") || "/admin";
  const bad = () => NextResponse.redirect(new URL("/admin/login?error=expired", url));
  if (!token) return bad();
  const row = await db.loginToken.findUnique({ where: { tokenHash: await sha256(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date() || !isAdminEmail(row.email)) return bad();
  // Single use: mark it used atomically.
  const claimed = await db.loginToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count !== 1) return bad();

  const res = NextResponse.redirect(new URL(next.startsWith("/admin") ? next : "/admin", url));
  res.cookies.set(SESSION_COOKIE, await createSession(row.email), {
    httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400,
  });
  return res;
}
