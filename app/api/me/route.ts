import { NextResponse } from "next/server";
import { currentUser, initials } from "@/lib/accounts";

export const dynamic = "force-dynamic";

/** Who is signed in — used by the header to show “My account” or “Admin”. */
export async function GET() {
  const u = await currentUser().catch(() => null);
  return NextResponse.json(u ? { email: u.email, name: u.name, role: u.role, initials: initials(u.name, u.email), company: u.company ?? "", title: u.title ?? "", phone: u.phone ?? "" } : null, { headers: { "cache-control": "no-store" } });
}
