import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminEmail } from "@/lib/session";
import { logActivity } from "@/lib/accounts";

/** Admin → Accounts: change a member's role or disable/enable the account. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const action = String((await req.formData()).get("action") || "");
  const back = () => NextResponse.redirect(new URL("/admin?tab=accounts&done=1", req.url), 303);
  const m = await db.member.findUnique({ where: { id } });
  if (!m || isAdminEmail(m.email)) return back();
  if (action === "admin" || action === "member") {
    await db.member.update({ where: { id }, data: { role: action } });
    await logActivity(m.email, action === "admin" ? "Given admin access" : "Admin access removed");
  }
  if (action === "disable" || action === "enable") await db.member.update({ where: { id }, data: { status: action === "disable" ? "disabled" : "active" } });
  return back();
}
