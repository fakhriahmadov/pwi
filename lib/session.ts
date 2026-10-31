/**
 * Admin sessions: a signed cookie holding the admin's email and expiry.
 * Uses Web Crypto only, so it works in middleware (edge) and in Node routes.
 */
export const SESSION_COOKIE = "pwi_admin";
export const SESSION_DAYS = 7;

const DEFAULT_ADMINS = ["fakhri.ahmadov@gmail.com", "fakhri@privatewealth.institute"];

/** Admin emails: ADMIN_EMAILS (comma-separated) or the two built-in addresses. */
export function adminEmails(): string[] {
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.length ? list : DEFAULT_ADMINS;
}
export const isAdminEmail = (email: string) => adminEmails().includes(email.trim().toLowerCase());

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = ""; bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64url = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (at least 32 characters).");
  return s;
}
async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export async function createSession(email: string) {
  const payload = b64url(enc.encode(JSON.stringify({ e: email.toLowerCase(), x: Date.now() + SESSION_DAYS * 864e5 })));
  return `${payload}.${await hmac(payload)}`;
}

/** Returns the signed-in admin's email, or null. Also re-checks the admin list. */
export async function readSession(value?: string | null): Promise<string | null> {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  try {
    const expected = await hmac(payload);
    if (expected.length !== sig.length) return null;
    let diff = 0; for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    if (diff) return null;
    const { e, x } = JSON.parse(fromB64url(payload)) as { e: string; x: number };
    if (Date.now() > x || !isAdminEmail(e)) return null;
    return e;
  } catch {
    return null;
  }
}

export async function sha256(s: string) {
  return b64url(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}
