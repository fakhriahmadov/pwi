import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getEvent, isPast, passPriceLabel } from "@/lib/events";
import { RegisterForm } from "./RegisterForm";
import { RequestForm } from "./RequestForm";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ pass?: string; cancelled?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  return e ? { title: `${e.registration === "approval" ? "Request an invitation" : "Register"} — ${e.series} ${e.city}`, robots: { index: false } } : {};
}

export default async function RegisterPage({ params, searchParams }: P) {
  const e = await getEvent((await params).slug);
  if (!e) notFound();
  const sp = await searchParams;
  const closed = isPast(e) || e.registration === "closed";
  const invite = e.registration === "approval" && !e.externalRegistrationUrl;
  const passes = e.passes.map((p) => ({ id: p.id, name: p.name, description: p.description, priceCents: p.priceCents, onRequest: Boolean(p.onRequest), label: passPriceLabel(p) }));
  return (
    <div className="paper" style={{ ["--acc" as string]: e.accent, ["--on-acc" as string]: e.onAccent }}>
      <div className="wrap stack" style={{ ["--g" as string]: "32px", paddingTop: "clamp(30px,7vw,72px)" }}>
        <div className="stack" style={{ ["--g" as string]: "8px" }}>
          <Link href={`/events/${e.slug}`} className="muted" style={{ fontSize: 13 }}>← {e.series} {e.city}</Link>
          <h1 style={{ fontSize: "clamp(36px,10vw,88px)", lineHeight: .92, letterSpacing: "-.05em" }}>{invite ? "Request an invitation" : "Register"}<span style={{ color: e.accent }}>.</span></h1>
          {invite && !closed && <p style={{ color: "var(--ink-body)", maxWidth: "60ch", fontSize: 17 }}>{e.series} {e.city} is by invitation. Tell us a little about yourself and our team will review your request personally — there is nothing to pay now.</p>}
        </div>
        {sp.cancelled && <p className="notice">Payment was cancelled — nothing was charged. You can try again below.</p>}
        {closed ? (
          <p className="notice">{invite ? "Invitation requests for this event are closed." : "Registration for this event is closed."}</p>
        ) : e.externalRegistrationUrl ? (
          <div className="stack" style={{ background: "var(--paper)", padding: 32, ["--g" as string]: "16px", maxWidth: 640 }}>
            <p className="h3">Registration for {e.city} is open on our booking page.</p>
            <a className="btn btn-acc" href={e.externalRegistrationUrl} style={{ alignSelf: "flex-start" }}>Continue to registration →</a>
          </div>
        ) : invite ? (
          <RequestForm event={{ slug: e.slug, city: e.city, date: e.date, venue: e.venue, address: e.address, accent: e.accent, email: e.email }} />
        ) : (
          <RegisterForm event={{ slug: e.slug, city: e.city, date: e.date, venue: e.venue, accent: e.accent, approval: e.registration === "approval" }} passes={passes} initialPass={sp.pass} />
        )}
      </div>
    </div>
  );
}
