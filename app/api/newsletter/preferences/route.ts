import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { fail, ok, parseBody, rateLimited } from "@/lib/http";
import { isFrequency, cleanTopics } from "@/lib/newsletter";

const schema = z.object({
  token: z.string().min(10),
  action: z.enum(["save", "unsubscribe", "resubscribe"]),
  frequency: z.string().optional(),
  topics: z.array(z.string()).optional(),
  name: z.string().max(120).optional(),
});

/** Changes made on /newsletter/preferences (reached from the link in every email). */
export async function POST(req: Request) {
  if (rateLimited(req, 20)) return fail("Too many attempts. Please wait a minute.", 429);
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  if (!dbConfigured()) return fail("The newsletter isn't available right now.", 503);
  const d = data!;
  const sub = await db.subscriber.findUnique({ where: { manageToken: d.token } });
  if (!sub) return fail("This link is no longer valid. Subscribe again from the Insights page.", 404);
  if (d.action === "unsubscribe") { await db.subscriber.update({ where: { id: sub.id }, data: { unsubscribed: true } }); return ok({ message: "You’re unsubscribed. You can come back at any time." }); }
  const topics = cleanTopics(d.topics ?? sub.topics);
  if (!topics.length) return fail("Choose at least one topic — or unsubscribe.");
  const frequency = isFrequency(d.frequency) ? d.frequency : sub.frequency;
  await db.subscriber.update({ where: { id: sub.id }, data: { frequency, topics, name: d.name ?? sub.name, unsubscribed: false } });
  return ok({ message: d.action === "resubscribe" ? "Welcome back — you’re subscribed again." : "Saved." });
}
