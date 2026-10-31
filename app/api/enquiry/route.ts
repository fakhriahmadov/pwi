import { z } from "zod";
import { db, dbConfigured } from "@/lib/db";
import { fail, ok, parseBody, rateLimited } from "@/lib/http";
import { notifyTeam } from "@/lib/registrations";

const schema = z.object({
  topic: z.enum(["general", "partner", "press", "speak", "data", "report"]),
  name: z.string().min(1, "is required").max(120),
  email: z.email("must be a valid email address"),
  company: z.string().max(160).optional(),
  country: z.string().max(80).optional(),
  message: z.string().max(5000).optional(),
});

const LABEL: Record<string, string> = { general: "General enquiry", partner: "Partnership enquiry", press: "Press enquiry", speak: "Speaker proposal", data: "Data request", report: "Report download" };

export async function POST(req: Request) {
  if (rateLimited(req)) return fail("Too many messages. Please wait a minute and try again.", 429);
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const d = data!;
  if (dbConfigured()) await db.enquiry.create({ data: { ...d, email: d.email.toLowerCase() } });
  await notifyTeam(`${LABEL[d.topic]} — ${d.name}`, { Name: d.name, Email: d.email, Organisation: d.company, Country: d.country, Message: d.message });
  return ok({ message: "Thanks — we'll be in touch." });
}
