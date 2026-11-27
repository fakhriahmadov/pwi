"use client";
import { useEffect } from "react";

/** Tells the server a story was read: once per browser, per story, per day. Feeds "Weekly briefing". */
export function ReadBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `pwi-read:${slug}:${new Date().toISOString().slice(0, 10)}`;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch { /* private mode: still count */ }
    const body = JSON.stringify({ slug });
    if (!(navigator.sendBeacon && navigator.sendBeacon("/api/news/read", new Blob([body], { type: "text/plain" }))))
      fetch("/api/news/read", { method: "POST", body, keepalive: true }).catch(() => {});
  }, [slug]);
  return null;
}
