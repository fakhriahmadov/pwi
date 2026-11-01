import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { deleteImage } from "@/lib/media";

/** Publish / unpublish / gate / ungate / delete (plain form posts from the reports page). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const action = String((await req.formData()).get("action") ?? "");
  const r = await db.report.findUnique({ where: { id } });
  if (r) {
    if (action === "delete") { await db.report.delete({ where: { id } }); await deleteImage(r.fileId); }
    else if (action === "publish" || action === "unpublish") await db.report.update({ where: { id }, data: { status: action === "publish" ? "published" : "draft" } });
    else if (action === "gate" || action === "ungate") await db.report.update({ where: { id }, data: { gated: action === "gate" } });
    revalidatePath("/indexes");
  }
  return NextResponse.redirect(new URL("/admin/reports?ok=1", req.url), 303);
}
