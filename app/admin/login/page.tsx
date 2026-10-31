import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign-in", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; signedout?: string }> }) {
  const sp = await searchParams;
  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "24px", maxWidth: 560 }}>
        <h1 className="h2">Admin sign-in<span className="dot">.</span></h1>
        {sp.error === "expired" && <p className="notice err" role="alert">That sign-in link has expired or was already used. Request a new one below.</p>}
        {sp.signedout && <p className="notice" role="status">You're signed out.</p>}
        <p style={{ color: "var(--ink)" }}>Enter your admin email address. We'll email you a link to sign in — no password needed.</p>
        <LoginForm next={sp.next} />
      </div>
    </section>
  );
}
