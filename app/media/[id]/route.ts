import { db, dbConfigured } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbConfigured()) return new Response("Not found", { status: 404 });
  const m = await db.media.findUnique({ where: { id } });
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(m.data), {
    headers: {
      "content-type": m.mime,
      "content-length": String(m.size),
      // Each upload gets a new id, so the file at this URL never changes.
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
