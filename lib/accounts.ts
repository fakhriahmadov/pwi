import { cookies } from "next/headers";
import { db, dbConfigured } from "./db";
import { readUser, isAdminEmail, SESSION_COOKIE, type Role } from "./session";

/** The signed-in person in a server component or action, with their Member record (created on first use). */
export async function currentUser() {
  const jar = await cookies();
  const u = await readUser(jar.get(SESSION_COOKIE)?.value);
  if (!u || !dbConfigured()) return null;
  const m = await ensureMember(u.email);
  if (!m || m.status !== "active") return null;
  return { ...m, role: (isAdminEmail(m.email) ? "admin" : m.role) as Role };
}

/** Finds a member; admin addresses always get a record. */
export async function ensureMember(email: string) {
  const e = email.trim().toLowerCase();
  const m = await db.member.findUnique({ where: { email: e } });
  if (m) return m;
  if (!isAdminEmail(e)) return null;
  return db.member.create({ data: { email: e, role: "admin" } });
}

/** Role used for a new session: ADMIN_EMAILS, or the member's role. */
export function roleOf(m: { email: string; role: string } | null): Role {
  return m && (isAdminEmail(m.email) || m.role === "admin") ? "admin" : "member";
}

export async function logActivity(email: string, text: string) {
  if (!dbConfigured()) return;
  await db.activity.create({ data: { email: email.toLowerCase(), text } }).catch(() => {});
}

export const initials = (name: string, email: string) => {
  const p = (name || email).split(/[\s@.]+/).filter(Boolean);
  return ((p[0]?.[0] ?? "?") + (p[1]?.[0] ?? "")).toUpperCase();
};
