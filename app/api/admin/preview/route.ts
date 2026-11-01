import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/** Turns on preview (draft) mode for the signed-in admin, then opens the page. */
export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("path") || "/";
  (await draftMode()).enable();
  redirect(path.startsWith("/") && !path.startsWith("//") ? path : "/");
}
