import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, passwordProblem } from "@/lib/password";
import { fail, ok, parseBody } from "@/lib/http";

const schema = z.object({ password: z.string(), confirm: z.string() });

/** Sets the signed-in admin's password (middleware guarantees a session). */
export async function POST(req: Request) {
  const email = req.headers.get("x-admin-email");
  if (!email) return fail("Please sign in.", 401);
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const problem = passwordProblem(data!.password);
  if (problem) return fail(problem);
  if (data!.password !== data!.confirm) return fail("The two passwords don't match.");
  const passwordHash = await hashPassword(data!.password);
  await db.adminUser.upsert({ where: { email }, create: { email, passwordHash }, update: { passwordHash } });
  return ok({ message: "Password saved. You can now sign in with your email and this password." });
}
