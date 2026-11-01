import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/db";

/** Unsubscribe link in every newsletter (?token=…, the subscriber's own secret). */
async function unsubscribe(token: string | null) {
  if (!token || !dbConfigured()) return false;
  const r = await db.subscriber.updateMany({ where: { manageToken: token }, data: { unsubscribed: true } });
  return r.count > 0;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!(await unsubscribe(token))) return NextResponse.redirect(new URL("/newsletter?status=invalid", url));
  return NextResponse.redirect(new URL(`/newsletter/preferences?token=${encodeURIComponent(token!)}&status=unsubscribed`, url));
}

/** One-click unsubscribe from the mail app (List-Unsubscribe-Post). */
export async function POST(req: Request) {
  const ok = await unsubscribe(new URL(req.url).searchParams.get("token"));
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
