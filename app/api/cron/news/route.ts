import { gatherNews } from "@/lib/news";
import { draftStories } from "@/lib/news-ai";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Called every morning by Vercel Cron (vercel.json): gathers headlines, then has AI draft stories for Admin → News.
 * With CRON_SECRET set in Vercel, only requests carrying it are accepted (Vercel sends it automatically).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const fromCron = (req.headers.get("user-agent") || "").startsWith("vercel-cron/");
  if (secret ? auth !== `Bearer ${secret}` : !fromCron) return new Response("Not allowed", { status: 401 });
  const gathered = await gatherNews();
  const drafted = await draftStories();
  return Response.json({ gathered, drafted });
}
