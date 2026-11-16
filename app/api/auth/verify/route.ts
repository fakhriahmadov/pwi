import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, sha256, SESSION_COOKIE, SESSION_DAYS } from "@/lib/session";
import { ensureMember, roleOf } from "@/lib/accounts";
import { safeNext } from "@/lib/auth-response";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const next = url.searchParams.get("next") || "";
  const bad = () => NextResponse.redirect(new URL("/signin?error=expired", url));
  if (!token) return bad();
  const row = await db.loginToken.findUnique({ where: { tokenHash: await sha256(token) } });
  const member = row ? await ensureMember(row.email) : null;
  if (!row || row.usedAt || row.expiresAt < new Date() || !member || member.status !== "active") return bad();
  // Single use: mark it used atomically.
  const claimed = await db.loginToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count !== 1) return bad();

  const role = roleOf(member);
  await db.member.update({ where: { id: member.id }, data: { lastSignIn: new Date(), method: "link" } });
  const res = NextResponse.redirect(new URL(safeNext(next, role), url));
  res.cookies.set(SESSION_COOKIE, await createSession(row.email, role), {
    httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400,
  });
  return res;
}
