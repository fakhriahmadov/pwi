import type { Metadata } from "next";
import { headers } from "next/headers";
import { db, dbConfigured } from "@/lib/db";
import { AdminNav } from "../AdminNav";
import { PasswordForm } from "./PasswordForm";

export const metadata: Metadata = { title: "Admin — Account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Account({ searchParams }: { searchParams: Promise<{ setup?: string }> }) {
  const email = (await headers()).get("x-admin-email") || "";
  const hasPassword = dbConfigured() ? Boolean(await db.adminUser.findUnique({ where: { email } })) : false;
  const setup = (await searchParams).setup;
  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "28px", paddingTop: 40, maxWidth: 1100 }}>
        <h1 className="h2">Account<span className="dot">.</span></h1>
        <AdminNav current="account" />
        {setup && <p className="notice" role="status">You're signed in. Set a password below to sign in directly next time.</p>}
        <div style={{ background: "var(--white)", padding: "clamp(20px,3vw,32px)", maxWidth: 560 }} className="stack">
          <h2 className="h3" style={{ fontSize: 24 }}>{hasPassword ? "Change your password" : "Set a password"}</h2>
          <p className="muted" style={{ fontSize: 14 }}>For {email}. At least 12 characters. You can always sign in with Google instead.</p>
          <PasswordForm />
        </div>
      </div>
    </section>
  );
}
