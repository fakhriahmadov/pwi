import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/db";

/** Counts one read of a published story (sent once per browser per story per day by ReadBeacon). Bots are ignored. */
export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") || "";
  if (!dbConfigured() || !ua || /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i.test(ua)) return new NextResponse(null, { status: 204 });
  let slug = "";
  try { slug = String((JSON.parse(await req.text()) as { slug?: unknown }).slug || "").slice(0, 200); } catch { /* ignore */ }
  if (!slug) return new NextResponse(null, { status: 204 });
  try {
    const s = await db.newsStory.findUnique({ where: { slug }, select: { id: true, status: true } });
    if (s?.status === "published") {
      const day = new Date().toISOString().slice(0, 10);
      await db.storyRead.upsert({ where: { storyId_day: { storyId: s.id, day } }, create: { storyId: s.id, day, reads: 1 }, update: { reads: { increment: 1 } } });
    }
  } catch (e) { console.error("[news] read count failed", e instanceof Error ? e.message : e); }
  return new NextResponse(null, { status: 204 });
}
