import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/** Sign out after deleting an account (a redirect target, so it's a GET). */
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/?account=deleted", req.url));
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
