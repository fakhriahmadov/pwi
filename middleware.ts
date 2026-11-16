import { NextResponse, type NextRequest } from "next/server";
import { readUser, SESSION_COOKIE } from "@/lib/session";

/** Only admins reach /admin and /api/admin. Signed-in members are sent to their account; everyone else to sign-in. */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  let user: Awaited<ReturnType<typeof readUser>> = null;
  try { user = await readUser(req.cookies.get(SESSION_COOKIE)?.value); } catch { user = null; }
  if (user?.role === "admin") {
    const headers = new Headers(req.headers);
    headers.set("x-admin-email", user.email);
    return NextResponse.next({ request: { headers } });
  }
  if (pathname.startsWith("/api/")) return NextResponse.json({ ok: false, message: user ? "Admins only." : "Please sign in." }, { status: user ? 403 : 401 });
  if (user) return NextResponse.redirect(new URL("/account?notice=admin-only", req.url));
  const url = new URL("/signin", req.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
