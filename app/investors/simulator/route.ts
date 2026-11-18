import fs from "node:fs/promises";
import path from "node:path";
import { currentUser } from "@/lib/accounts";
import { getContent } from "@/lib/content";
import { simulatorConfig, simulatorTokens } from "@/lib/investor-settings";

export const dynamic = "force-dynamic";

/** The fund simulator: only for signed-in members who confirmed investor status. Never cached or indexed. */
export async function GET() {
  const me = await currentUser().catch(() => null);
  const inv = me?.investor as { confirmed?: string } | null | undefined;
  if (!me || !inv?.confirmed) return new Response("Please sign in and confirm your investor status first.", { status: 403 });
  let html = await fs.readFile(path.join(process.cwd(), "content/investors/elf1-simulator.html"), "utf8");
  // Every number comes from Admin → Investors (published values; the defaults are the deck's model).
  const cfg = simulatorConfig(await getContent("investors"));
  for (const [token, value] of Object.entries(simulatorTokens(cfg))) html = html.split(token).join(value);
  const json = JSON.stringify(cfg).replace(/</g, "\\u003c");
  html = html.replace("<script>\n/* European Lifestyle Fund 1", `<script>window.ELF_CFG = ${json};</script>\n<script>\n/* European Lifestyle Fund 1`);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow", "x-frame-options": "SAMEORIGIN" } });
}
