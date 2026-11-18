"use client";
import { useState } from "react";

/** Copies the page address; says "Copied" for a moment. */
export function CopyLink({ url, className, children }: { url: string; className?: string; children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className={className} onClick={() => { navigator.clipboard?.writeText(url).then(() => { setDone(true); setTimeout(() => setDone(false), 1800); }).catch(() => {}); }}>
      {children}<span>{done ? "Copied" : "Copy link"}</span>
    </button>
  );
}
