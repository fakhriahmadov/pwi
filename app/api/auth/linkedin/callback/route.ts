import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureMember, roleOf } from "@/lib/accounts";
import { db } from "@/lib/db";
import { withSession, safeNext } from "@/lib/auth-response";
import { site } from "@/content/site";

/** LinkedIn sends the visitor back here; we check the state, read their verified email and sign them in. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const back = (code: string) => NextResponse.redirect(new URL(`/signin?error=${code}`, url));
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!code || !state || state !== jar.get("li_state")?.value) return back("linkedin-failed");

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code", code, redirect_uri: `${site.url}/api/auth/linkedin/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID || "", client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
    }),
  }).catch(() => null);
  if (!tokenRes?.ok) return back("linkedin-failed");
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  const infoRes = await fetch("https://api.linkedin.com/v2/userinfo", { headers: { authorization: `Bearer ${access_token}` } }).catch(() => null);
  if (!infoRes?.ok) return back("linkedin-failed");
  const info = (await infoRes.json()) as { email?: string; email_verified?: boolean; name?: string };
  if (!info.email || info.email_verified === false) return back("linkedin-failed");
  const email = info.email.toLowerCase();
  const member = (await ensureMember(email)) ?? (await db.member.create({ data: { email, name: String(info.name ?? ""), method: "linkedin" } }));
  if (member.status !== "active") return back("disabled");
  await db.member.update({ where: { id: member.id }, data: { lastSignIn: new Date(), method: "linkedin" } });
  const role = roleOf(member);

  const res = NextResponse.redirect(new URL(safeNext(jar.get("li_next")?.value, role), url));
  for (const c of ["li_state", "li_next"]) res.cookies.set(c, "", { path: "/api/auth/linkedin", maxAge: 0 });
  return withSession(res, email, req, role);
}
