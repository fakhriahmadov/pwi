import { gatherNews } from "@/lib/news";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Called every morning by Vercel Cron (vercel.json) to gather news candidates for Admin → News.
 * With CRON_SECRET set in Vercel, only requests carrying it are accepted (Vercel sends it automatically).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const fromCron = (req.headers.get("user-agent") || "").startsWith("vercel-cron/");
  if (secret ? auth !== `Bearer ${secret}` : !fromCron) return new Response("Not allowed", { status: 401 });
  const r = await gatherNews();
  return Response.json(r);
}
