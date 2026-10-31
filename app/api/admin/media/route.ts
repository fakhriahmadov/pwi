import { NextResponse } from "next/server";
import { storeImage, UploadError } from "@/lib/media";

/** Uploads an image for use inside an article body. Returns its URL. */
export async function POST(req: Request) {
  try {
    const id = await storeImage((await req.formData()).get("file"));
    if (!id) return NextResponse.json({ ok: false, message: "Please choose an image." }, { status: 400 });
    return NextResponse.json({ ok: true, url: `/media/${id}` });
  } catch (e) {
    const msg = e instanceof UploadError ? e.message : "The upload failed. Please try again.";
    if (!(e instanceof UploadError)) console.error(e);
    return NextResponse.json({ ok: false, message: msg }, { status: 400 });
  }
}
