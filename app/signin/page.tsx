import type { Metadata } from "next";
import Link from "next/link";
import { currentUser, initials } from "@/lib/accounts";
import { SignInForm } from "./SignInForm";
import s from "./signin.module.css";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  expired: "That sign-in link has expired or was already used. Request a new one below.",
  "google-failed": "Google sign-in didn't complete. Please try again.",
  "google-off": "Google sign-in isn't switched on yet. Use your email and password, or email yourself a sign-in link.",
  "linkedin-failed": "LinkedIn sign-in didn't complete. Please try again.",
  "linkedin-off": "LinkedIn sign-in isn't switched on yet. Use your email and password, or email yourself a sign-in link.",
  disabled: "This account is disabled. Write to info@privatewealth.institute.",
};

/** One sign-in for everyone: members land on My account, the institute's team on the admin area. */
export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; signedout?: string; tab?: string }> }) {
  const sp = await searchParams;
  const me = await currentUser().catch(() => null);
  const h1 = { margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(32px, 7vw, 48px)", lineHeight: 1, letterSpacing: "-.035em" } as const;
  return (
    <div className={s.page}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "clamp(40px,7vw,80px) clamp(16px,4vw,32px) 96px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 20 }}>
        {me ? (
          <>
            <h1 style={h1}>You’re signed in<span className="dot">.</span></h1>
            <div style={{ background: "var(--paper)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className={s.av} style={me.role === "admin" ? { background: "var(--ink)", color: "var(--paper)" } : { background: "var(--sand-2)" }}>{initials(me.name, me.email)}</span>
                <div style={{ minWidth: 0 }}><b style={{ display: "block", fontWeight: 500 }}>{me.name || me.email}</b><span style={{ fontSize: 13, color: "var(--ink-muted)", overflowWrap: "anywhere" }}>{me.email} · {me.role === "admin" ? "Admin" : "Member"}</span></div>
              </div>
              <Link className={s.go} href={me.role === "admin" ? "/admin" : "/account"}>{me.role === "admin" ? "Open the admin area" : "Go to my account"} →</Link>
              {me.role === "admin" && <Link href="/account" style={{ fontSize: 14 }}>My own registrations and newsletter</Link>}
              <form method="post" action="/api/auth/logout"><button className={s.textlink}>Sign out</button></form>
            </div>
          </>
        ) : (
          <>
            {sp.error && ERRORS[sp.error] && <p className={s.err} role="alert">{ERRORS[sp.error]}</p>}
            {sp.signedout && <p style={{ margin: 0, padding: "12px 14px", background: "var(--paper)", fontSize: 14 }} role="status">You’re signed out.</p>}
            <SignInForm next={sp.next || ""} startTab={sp.tab === "up" ? "up" : "in"} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} linkedinEnabled={Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET)} />
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>One sign-in for everyone. Members see their registrations, newsletter and settings; the institute’s team also gets the admin area.</p>
          </>
        )}
      </div>
    </div>
  );
}
