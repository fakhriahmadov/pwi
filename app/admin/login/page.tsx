import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign-in", robots: { index: false } };

const ERRORS: Record<string, string> = {
  expired: "That sign-in link has expired or was already used. Request a new one below.",
  "google-failed": "Google sign-in didn't complete. Please try again.",
  "google-off": "Google sign-in isn't set up yet. Use your email and password, or email yourself a sign-in link.",
  "not-admin": "That Google account doesn't have admin access. Use fakhri.ahmadov@gmail.com or fakhri@privatewealth.institute.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; signedout?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/admin") ? sp.next : "/admin";
  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "24px", maxWidth: 560 }}>
        <h1 className="h2">Admin sign-in<span className="dot">.</span></h1>
        {sp.error && ERRORS[sp.error] && <p className="notice err" role="alert">{ERRORS[sp.error]}</p>}
        {sp.signedout && <p className="notice" role="status">You're signed out.</p>}
        <LoginForm next={next} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} />
      </div>
    </section>
  );
}
