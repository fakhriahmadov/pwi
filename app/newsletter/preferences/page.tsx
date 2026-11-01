import Link from "next/link";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { PreferencesForm } from "./PreferencesForm";

export const metadata: Metadata = { title: "Newsletter preferences", robots: { index: false } };
export const dynamic = "force-dynamic";

const BANNER: Record<string, string> = {
  confirmed: "Thank you — your subscription is confirmed. You can change it here at any time.",
  unsubscribed: "You’re unsubscribed and won’t receive further emails. Changed your mind? Subscribe again below.",
};

/** Reached from the link at the bottom of every newsletter (?token=… is the subscriber's own secret). */
export default async function Preferences({ searchParams }: { searchParams: Promise<{ token?: string; status?: string }> }) {
  const { token, status } = await searchParams;
  const sub = token && dbConfigured() ? await db.subscriber.findUnique({ where: { manageToken: token } }).catch(() => null) : null;
  return (
    <section className="paper">
      <div className="wrap stack" style={{ ["--g" as string]: "24px", maxWidth: 760 }}>
        <h1 className="h2-big">Your newsletter<span className="dot">.</span></h1>
        {!sub ? (
          <>
            <p style={{ color: "var(--ink-body)" }}>This link is no longer valid. You can subscribe again from the Insights page.</p>
            <Link className="btn btn-dark" href="/insights#newsletter" style={{ alignSelf: "flex-start" }}>Go to Insights</Link>
          </>
        ) : (
          <>
            {status && BANNER[status] && <p className="notice okay" role="status">{BANNER[status]}</p>}
            <PreferencesForm token={token!} email={sub.email} name={sub.name ?? ""} frequency={sub.frequency} topics={sub.topics} unsubscribed={sub.unsubscribed} />
          </>
        )}
      </div>
    </section>
  );
}
