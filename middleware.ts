import { NextResponse, type NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/session";

/** Only signed-in admins (see lib/session.ts) reach /admin and /api/admin. */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  let email: string | null = null;
  try { email = await readSession(req.cookies.get(SESSION_COOKIE)?.value); } catch { email = null; }
  if (email) {
    const headers = new Headers(req.headers);
    headers.set("x-admin-email", email);
    return NextResponse.next({ request: { headers } });
  }
  if (pathname.startsWith("/api/")) return NextResponse.json({ ok: false, message: "Please sign in." }, { status: 401 });
  const url = new URL("/admin/login", req.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
