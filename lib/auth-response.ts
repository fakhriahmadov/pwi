import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, SESSION_DAYS, type Role } from "./session";

/** Sets the session cookie on a response. */
export async function withSession<T extends NextResponse>(res: T, email: string, req: Request, role?: Role) {
  res.cookies.set(SESSION_COOKIE, await createSession(email, role), {
    httpOnly: true, secure: new URL(req.url).protocol === "https:", sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400,
  });
  return res;
}

/** Where to go after sign-in: only paths on this site; admins default to /admin, members to /account. */
export const safeNext = (n?: string | null, role: Role = "admin") =>
  n && /^\/(admin|account|investors)(\/|\?|$)/.test(n) && !n.startsWith("//") && (role === "admin" || !n.startsWith("/admin")) ? n : role === "admin" ? "/admin" : "/account";
