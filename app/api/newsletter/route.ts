import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { fail, ok, parseBody, rateLimited } from "@/lib/http";
import { isFrequency, cleanTopics, newToken, sendConfirmation } from "@/lib/newsletter";

const schema = z.object({
  email: z.email("Please enter a valid email address."),
  name: z.string().max(120).optional(),
  frequency: z.string().optional(),
  topics: z.array(z.string()).optional(),
  consent: z.boolean().optional(),
  source: z.string().max(80).optional(),
});

/** Sign-up: saves the choice and emails a confirmation link (double opt-in). */
export async function POST(req: Request) {
  if (rateLimited(req)) return fail("Too many attempts. Please wait a minute.", 429);
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const d = data!;
  if (!d.consent) return fail("Please tick the box to agree to receive the newsletter.");
  const topics = cleanTopics(d.topics ?? ["insights", "events"]);
  if (!topics.length) return fail("Choose at least one topic.");
  const frequency = isFrequency(d.frequency) ? d.frequency : "monthly";
  if (!dbConfigured()) return fail("Subscriptions aren't open yet. Please write to info@privatewealth.institute.", 503);
  const email = d.email.toLowerCase();
  const existing = await db.subscriber.findUnique({ where: { email } });
  if (existing?.confirmedAt && !existing.unsubscribed) return ok(); // already subscribed: don't reveal who is on the list
  const token = newToken();
  await db.subscriber.upsert({
    where: { email },
    create: { email, name: d.name || null, frequency, topics, source: d.source, confirmToken: token },
    update: { name: d.name || existing?.name || null, frequency, topics, source: d.source ?? existing?.source, confirmToken: token, unsubscribed: false, confirmedAt: null },
  });
  await sendConfirmation(email, token, frequency, topics);
  return ok();
}
