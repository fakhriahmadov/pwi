"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Copies an event from the code file into the editor, then opens it. */
export function ImportButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" className="chip" disabled={busy} onClick={async () => {
      setBusy(true);
      const r = await fetch("/api/admin/events/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "import", slug }) });
      const j = await r.json().catch(() => ({}));
      if (j.redirect) router.push(j.redirect); else setBusy(false);
    }}>{busy ? "Opening…" : "Make editable"}</button>
  );
}
