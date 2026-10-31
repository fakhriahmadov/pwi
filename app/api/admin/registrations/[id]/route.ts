import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEvent, getPass } from "@/lib/events";
import { createCheckout, issueTicket, sendTicketEmail } from "@/lib/registrations";
import { sendMail, layout, esc } from "@/lib/email";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const action = String((await req.formData()).get("action") || "");
  const back = (q = "done=1") => NextResponse.redirect(new URL(`/admin?${q}`, req.url), 303);

  if (action === "enquiry-done") {
    await db.enquiry.update({ where: { id }, data: { handled: true } });
    return back("tab=enquiries&done=1");
  }

  const reg = await db.registration.findUnique({ where: { id } });
  if (!reg) return back("tab=registrations");
  const tab = `tab=registrations&event=${reg.eventSlug}&done=1`;

  if (action === "approve") {
    const e = getEvent(reg.eventSlug);
    const pass = e && getPass(e, reg.passId);
    if (pass && pass.priceCents != null && !pass.onRequest) {
      const url = await createCheckout(reg, pass.priceCents);
      await db.registration.update({ where: { id }, data: { status: "APPROVED" } });
      await sendMail({ to: reg.email, subject: `Your place at ${e!.series} ${e!.city}`, html: layout("Your registration is approved.", `<p>Dear ${esc(reg.firstName)},</p><p>We're delighted to confirm your place. Please complete your registration with secure payment:</p><p><a href="${url}" style="display:inline-block;background:#0A0A0A;color:#fff;padding:14px 22px;text-decoration:none;font-weight:bold">Complete registration</a></p><p style="color:#5E5A54;font-size:13px">This link is valid for 24 hours. Reply to this email if you need a new one.</p>`) });
    } else {
      await issueTicket(id); // on-request or free: confirm and issue ticket
    }
    return back(tab);
  }
  if (action === "checkin") await db.registration.update({ where: { id }, data: { checkedInAt: new Date() } });
  if (action === "cancel") await db.registration.update({ where: { id }, data: { status: "CANCELLED" } });
  if (action === "resend") await sendTicketEmail(reg);
  return back(tab);
}
