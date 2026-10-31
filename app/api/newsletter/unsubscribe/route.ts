import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/db";

// Link format: /api/newsletter/unsubscribe?email=…  (add to newsletter footers via your email tool)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.toLowerCase();
  if (email && dbConfigured()) await db.subscriber.updateMany({ where: { email }, data: { unsubscribed: true } });
  return NextResponse.redirect(new URL("/newsletter?status=unsubscribed", url));
}
