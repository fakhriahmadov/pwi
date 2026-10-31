import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export const fail = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });
export const ok = (data: Record<string, unknown> = {}) => NextResponse.json({ ok: true, ...data });

/** Parses a JSON body against a schema. Honeypot field `website` must stay empty. */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<{ data?: T; error?: NextResponse }> {
  let raw: unknown;
  try { raw = await req.json(); } catch { return { error: fail("The form could not be read. Please try again.") }; }
  if (raw && typeof raw === "object" && (raw as Record<string, unknown>).website) return { error: ok() }; // bot: pretend success
  const r = schema.safeParse(raw);
  if (!r.success) {
    const first = r.error.issues[0];
    return { error: fail(first ? `${first.path.join(".") || "Form"}: ${first.message}` : "Please check the form.") };
  }
  return { data: r.data };
}

// Small in-memory rate limit per IP (per server instance).
const hits = new Map<string, number[]>();
export function rateLimited(req: Request, max = 8, windowMs = 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > max;
}
