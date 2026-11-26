import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { safeNext } from "@/lib/auth-response";
import { site } from "@/content/site";

/** Starts "Continue with LinkedIn" (Sign In with LinkedIn using OpenID Connect). */
export async function GET(req: Request) {
  const id = process.env.LINKEDIN_CLIENT_ID;
  const url = new URL(req.url);
  if (!id || !process.env.LINKEDIN_CLIENT_SECRET) return NextResponse.redirect(new URL("/signin?error=linkedin-off", url));
  const state = crypto.randomBytes(24).toString("base64url");
  const auth = new URL("https://www.linkedin.com/oauth/v2/authorization");
  auth.search = new URLSearchParams({
    response_type: "code", client_id: id, redirect_uri: `${site.url}/api/auth/linkedin/callback`, state, scope: "openid profile email",
  }).toString();
  const res = NextResponse.redirect(auth);
  const opts = { httpOnly: true, secure: url.protocol === "https:", sameSite: "lax" as const, path: "/api/auth/linkedin", maxAge: 600 };
  res.cookies.set("li_state", state, opts);
  res.cookies.set("li_next", safeNext(url.searchParams.get("next")), opts);
  return res;
}
