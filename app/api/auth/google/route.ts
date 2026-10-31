import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { safeNext } from "@/lib/auth-response";
import { site } from "@/content/site";

/** Starts "Continue with Google" (OAuth 2.0 authorization code flow with PKCE). */
export async function GET(req: Request) {
  const id = process.env.GOOGLE_CLIENT_ID;
  const url = new URL(req.url);
  if (!id || !process.env.GOOGLE_CLIENT_SECRET) return NextResponse.redirect(new URL("/admin/login?error=google-off", url));
  const state = crypto.randomBytes(24).toString("base64url");
  const verifier = crypto.randomBytes(48).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: id, response_type: "code", scope: "openid email",
    redirect_uri: `${site.url}/api/auth/google/callback`, state,
    code_challenge: challenge, code_challenge_method: "S256", prompt: "select_account",
  }).toString();
  const res = NextResponse.redirect(auth);
  const opts = { httpOnly: true, secure: url.protocol === "https:", sameSite: "lax" as const, path: "/api/auth/google", maxAge: 600 };
  res.cookies.set("g_state", state, opts);
  res.cookies.set("g_verifier", verifier, opts);
  res.cookies.set("g_next", safeNext(url.searchParams.get("next")), opts);
  return res;
}
