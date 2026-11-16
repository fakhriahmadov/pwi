import fs from "node:fs/promises";
import path from "node:path";
import { currentUser } from "@/lib/accounts";

export const dynamic = "force-dynamic";

/** The fund simulator: only for signed-in members who confirmed investor status. Never cached or indexed. */
export async function GET() {
  const me = await currentUser().catch(() => null);
  const inv = me?.investor as { confirmed?: string } | null | undefined;
  if (!me || !inv?.confirmed) return new Response("Please sign in and confirm your investor status first.", { status: 403 });
  const html = await fs.readFile(path.join(process.cwd(), "content/investors/elf1-simulator.html"), "utf8");
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow", "x-frame-options": "SAMEORIGIN" } });
}
