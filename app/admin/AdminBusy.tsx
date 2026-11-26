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
  // Phones show table rows as cards: copy each column's header into its cells so every value keeps its label.
  useEffect(() => {
    let raf = 0;
    const label = () => {
      raf = 0;
      document.querySelectorAll<HTMLTableElement>(".admin table.table").forEach((t) => {
        const heads = Array.from(t.querySelectorAll("thead th")).map((th) => th.textContent?.trim() || "");
        t.querySelectorAll("tbody tr").forEach((tr) => Array.from(tr.children).forEach((td, i) => { if (heads[i] && td.getAttribute("data-label") !== heads[i]) td.setAttribute("data-label", heads[i]); }));
      });
    };
    label();
    const mo = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(label); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);
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
