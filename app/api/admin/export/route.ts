import { db } from "@/lib/db";

const csv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return "";
  const head = Object.keys(rows[0]);
  const cell = (v: unknown) => { const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [head.join(","), ...rows.map((r) => head.map((h) => cell(r[h])).join(","))].join("\n");
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  let rows: Record<string, unknown>[] = [];
  if (type === "registrations") {
    rows = await db.registration.findMany({ where: { eventSlug: url.searchParams.get("event") || undefined }, orderBy: [{ lastName: "asc" }] });
  } else if (type === "enquiries") {
    rows = (await db.enquiry.findMany({ orderBy: { createdAt: "desc" } })).map(({ meta: _m, ...r }) => r);
  } else if (type === "subscribers") {
    rows = (await db.subscriber.findMany({ where: { confirmedAt: { not: null }, unsubscribed: false } })).map(({ confirmToken: _t, ...r }) => r);
  } else return new Response("Unknown export", { status: 400 });
  return new Response(csv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="pwi-${type}-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
