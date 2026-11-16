import { redirect } from "next/navigation";

/** The admin sign-in is now the shared sign-in page. */
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const q = new URLSearchParams({ next: sp.next || "/admin", ...(sp.error ? { error: sp.error } : {}) });
  redirect(`/signin?${q}`);
}
