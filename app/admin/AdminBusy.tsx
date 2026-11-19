"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Feedback for every admin form: the pressed button shows a spinner and is locked until the page answers,
 * and a small note at the bottom says the work is under way (drafting with AI can take a minute).
 */
export function AdminBusy() {
  const [busy, setBusy] = useState("");
  const path = usePathname();
  const query = useSearchParams()?.toString();
  // The page answered (redirect or refresh): unlock everything.
  useEffect(() => {
    setBusy("");
    document.querySelectorAll<HTMLElement>("[data-busy]").forEach((b) => { delete b.dataset.busy; b.removeAttribute("aria-disabled"); b.style.pointerEvents = ""; });
  }, [path, query]);
  useEffect(() => {
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (!form.closest(".admin")) return;
      const btn = (e.submitter as HTMLButtonElement | null) ?? form.querySelector<HTMLButtonElement>("button:not([type=button])");
      if (!btn) return;
      const label = btn.textContent?.trim() || "Working";
      // Lock after the browser has read the button's action, so the submission itself is not affected.
      setTimeout(() => { btn.dataset.busy = "1"; btn.setAttribute("aria-disabled", "true"); btn.style.pointerEvents = "none"; }, 0);
      setBusy(/fetch|draft|comparison/i.test(label) ? `${label}: working — this can take up to a minute. Please keep this page open.` : `${label}…`);
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);
  return busy ? <p className="adm-busy" role="status" aria-live="polite"><span className="adm-spin" aria-hidden="true" />{busy}</p> : null;
}
