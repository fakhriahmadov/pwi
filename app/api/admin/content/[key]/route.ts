import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { pageDef } from "@/lib/content-schema";
import { fail, ok } from "@/lib/http";

/** Save draft / publish / discard draft / reset to default for one content block. */
export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const def = pageDef(key);
  if (!def) return fail("Unknown page.", 404);
  const by = req.headers.get("x-admin-email") ?? undefined;
  let body: { action?: string; values?: Record<string, unknown> };
  try { body = await req.json(); } catch { return fail("The form could not be read."); }
  const allowed = new Set(def.sections.flatMap((s) => s.fields.map((f) => f.key)));
  const values = Object.fromEntries(Object.entries(body.values ?? {}).filter(([k]) => allowed.has(k))) as Prisma.InputJsonValue;
  const row = await db.contentBlock.findUnique({ where: { key } });

  switch (body.action) {
    case "draft":
      await db.contentBlock.upsert({ where: { key }, create: { key, draft: values, updatedBy: by }, update: { draft: values, updatedBy: by } });
      return ok({ message: "Draft saved. Visitors still see the published version." });
    case "publish":
      await db.contentBlock.upsert({ where: { key }, create: { key, draft: values, published: values, publishedAt: new Date(), updatedBy: by }, update: { draft: values, published: values, publishedAt: new Date(), updatedBy: by } });
      break;
    case "discard":
      if (row) await db.contentBlock.update({ where: { key }, data: { draft: (row.published ?? Prisma.DbNull) as Prisma.InputJsonValue, updatedBy: by } });
      return ok({ message: "Draft discarded." });
    case "reset":
      await db.contentBlock.delete({ where: { key } }).catch(() => {});
      break;
    default:
      return fail("Unknown action.");
  }
  // Published content changed: refresh every page (settings and footer appear everywhere).
  revalidatePath("/", "layout");
  return ok({ message: body.action === "reset" ? "Reset to the original text. It's live." : "Published. It's live on the site." });
}
