import { notFound } from "next/navigation";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { db, dbConfigured } from "@/lib/db";
import { getEvent } from "@/lib/events";
import { longDate, weekday } from "@/lib/format";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Your ticket", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Ticket({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!dbConfigured()) notFound();
  const reg = await db.registration.findUnique({ where: { ticketCode: code } });
  if (!reg || reg.status !== "PAID") notFound();
  const e = getEvent(reg.eventSlug);
  const qr = await QRCode.toDataURL(`${site.url}/tickets/${code}`, { width: 360, margin: 1 });
  return (
    <section className="paper">
      <div className="wrap" style={{ maxWidth: 560 }}>
        <div style={{ background: "var(--white)" }}>
          <div style={{ background: e?.accent, color: e?.onAccent, padding: "24px 28px" }}>
            <span className="kicker" style={{ color: "inherit" }}>{e?.series}</span>
            <div style={{ fontFamily: "var(--display)", fontSize: 56, lineHeight: .9, letterSpacing: "-.045em" }}>{e?.city}.</div>
          </div>
          <div className="stack" style={{ padding: 28, ["--g" as string]: "16px", alignItems: "center", textAlign: "center" }}>
            <img src={qr} alt={`QR code for ticket ${code}`} width={240} height={240} />
            <span style={{ fontFamily: "var(--display)", fontSize: 24, letterSpacing: ".1em" }}>{code}</span>
            <span className="h3" style={{ fontSize: 20 }}>{reg.firstName} {reg.lastName}</span>
            <span className="muted">{reg.passName} × {reg.quantity}</span>
            {e && <span style={{ fontSize: 14 }}>{weekday(e.date)}, {longDate(e.date)} · {e.venue}</span>}
            {reg.checkedInAt && <span className="pill PAID">Checked in</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
