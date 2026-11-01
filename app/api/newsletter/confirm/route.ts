import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/db";
import { syncSubscriber } from "@/lib/crm";
import { newToken } from "@/lib/newsletter";

/** Link from the confirmation email. Lands on the subscriber's preferences page. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || !dbConfigured()) return NextResponse.redirect(new URL("/newsletter?status=invalid", url));
  const sub = await db.subscriber.findUnique({ where: { confirmToken: token } });
  if (!sub) return NextResponse.redirect(new URL("/newsletter?status=invalid", url));
  const manageToken = sub.manageToken ?? newToken();
  await db.subscriber.update({ where: { id: sub.id }, data: { confirmedAt: new Date(), confirmToken: null, unsubscribed: false, manageToken } });
  await syncSubscriber(sub.email);
  return NextResponse.redirect(new URL(`/newsletter/preferences?token=${encodeURIComponent(manageToken)}&status=confirmed`, url));
}
