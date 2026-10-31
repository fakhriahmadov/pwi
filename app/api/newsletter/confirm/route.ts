import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/db";
import { syncSubscriber } from "@/lib/crm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || !dbConfigured()) return NextResponse.redirect(new URL("/newsletter?status=invalid", url));
  const sub = await db.subscriber.findUnique({ where: { confirmToken: token } });
  if (!sub) return NextResponse.redirect(new URL("/newsletter?status=invalid", url));
  await db.subscriber.update({ where: { id: sub.id }, data: { confirmedAt: new Date(), confirmToken: null, unsubscribed: false } });
  await syncSubscriber(sub.email);
  return NextResponse.redirect(new URL("/newsletter?status=confirmed", url));
}
