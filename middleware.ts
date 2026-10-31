import { NextResponse, type NextRequest } from "next/server";

/** HTTP basic auth for the admin area. Set ADMIN_USER and ADMIN_PASSWORD. */
export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) return new NextResponse("Admin is disabled: set ADMIN_USER and ADMIN_PASSWORD.", { status: 503 });
  const header = req.headers.get("authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const [u, ...rest] = atob(encoded).split(":");
    if (u === user && rest.join(":") === pass) return NextResponse.next();
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="PWI admin"' } });
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
