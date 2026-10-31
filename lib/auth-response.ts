import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, SESSION_DAYS } from "./session";

/** Sets the admin session cookie on a response. */
export async function withSession<T extends NextResponse>(res: T, email: string, req: Request) {
  res.cookies.set(SESSION_COOKIE, await createSession(email), {
    httpOnly: true, secure: new URL(req.url).protocol === "https:", sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400,
  });
  return res;
}

export const safeNext = (n?: string | null) => (n && n.startsWith("/admin") && !n.startsWith("//") ? n : "/admin");
