"use client";
import { useState } from "react";

type State = { status: "idle" | "sending" | "done" | "error"; message?: string; data?: Record<string, unknown> };

/** Posts a form's fields as JSON and tracks the result. */
export function useSubmit(url: string) {
  const [state, setState] = useState<State>({ status: "idle" });
  async function submit(e: React.FormEvent<HTMLFormElement>, extra: Record<string, unknown> = {}) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body: Record<string, unknown> = { ...extra };
    fd.forEach((v, k) => { body[k] = typeof v === "string" ? v.trim() : v; });
    form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((c) => { if (c.name) body[c.name] = c.checked; });
    setState({ status: "sending" });
    try {
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        setState({ status: "error", message: json.message || "Something went wrong. Please try again, or write to info@privatewealth.institute." });
        return null;
      }
      setState({ status: "done", data: json, message: json.message });
      return json;
    } catch {
      setState({ status: "error", message: "We couldn't reach the server. Check your connection and try again." });
      return null;
    }
  }
  return { state, submit };
}
