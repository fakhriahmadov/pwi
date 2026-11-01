import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { storePdf, UploadError } from "@/lib/media";
import { fail, ok } from "@/lib/http";

/** Upload a new report (multipart form). Starts as a draft. */
export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const title = String(fd.get("title") ?? "").trim();
    const date = String(fd.get("date") ?? "").trim();
    if (!title) return fail("Please give the report a title.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Please choose a publication date.");
    const fileId = await storePdf(fd.get("file"));
    const pages = Number.parseInt(String(fd.get("pages") ?? ""), 10) || null;
    await db.report.create({ data: { title, date, pages, fileId, gated: fd.get("gated") === "on", status: fd.get("publish") === "on" ? "published" : "draft" } });
    revalidatePath("/insights");
    return ok({ message: "Report uploaded." });
  } catch (e) {
    if (e instanceof UploadError) return fail(e.message);
    console.error(e);
    return fail("The upload failed. Please try again.", 500);
  }
}
