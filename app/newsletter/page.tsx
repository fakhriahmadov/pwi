import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Newsletter", robots: { index: false } };
const COPY: Record<string, [string, string]> = {
  confirmed: ["You're subscribed", "Thank you for confirming. Your briefing — insights, index updates and upcoming events — will arrive in your inbox."],
  unsubscribed: ["You're unsubscribed", "You won't receive further newsletters. You can subscribe again at any time."],
  invalid: ["That link has expired", "Please subscribe again from the Insights page."],
};

export default async function Newsletter({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [title, body] = COPY[(await searchParams).status || ""] || COPY.invalid;
  return (
    <section className="paper"><div className="wrap stack" style={{ ["--g" as string]: "16px", maxWidth: 880 }}>
      <h1 className="h2-big">{title}<span className="dot">.</span></h1>
      <p style={{ color: "var(--ink-body)" }}>{body}</p>
      <Link className="btn btn-dark" href="/insights" style={{ alignSelf: "flex-start" }}>Read the insights</Link>
    </div></section>
  );
}
