import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/session";
import { withSession, safeNext } from "@/lib/auth-response";
import { site } from "@/content/site";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const back = (code: string) => NextResponse.redirect(new URL(`/admin/login?error=${code}`, url));
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!code || !state || state !== jar.get("g_state")?.value) return back("google-failed");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, grant_type: "authorization_code",
      client_id: process.env.GOOGLE_CLIENT_ID || "", client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: `${site.url}/api/auth/google/callback`, code_verifier: jar.get("g_verifier")?.value || "",
    }),
  }).catch(() => null);
  if (!tokenRes?.ok) return back("google-failed");
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${access_token}` } }).catch(() => null);
  if (!infoRes?.ok) return back("google-failed");
  const info = (await infoRes.json()) as { email?: string; email_verified?: boolean };
  if (!info.email || !info.email_verified || !isAdminEmail(info.email)) return back("not-admin");

  const res = NextResponse.redirect(new URL(safeNext(jar.get("g_next")?.value), url));
  for (const c of ["g_state", "g_verifier", "g_next"]) res.cookies.set(c, "", { path: "/api/auth/google", maxAge: 0 });
  return withSession(res, info.email, req);
}
