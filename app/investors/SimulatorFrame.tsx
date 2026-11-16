"use client";
import { useEffect, useRef, useState } from "react";

/** Shows the simulator at its full height, and records presentation requests made inside it. */
export function SimulatorFrame() {
  const ref = useRef<HTMLIFrameElement>(null);
  const [h, setH] = useState(3600);
  useEffect(() => {
    const fit = () => { try { const d = ref.current?.contentDocument?.documentElement; if (d && Math.abs(d.scrollHeight - h) > 4) setH(d.scrollHeight); } catch {} };
    const t = setInterval(fit, 1000);
    const onMsg = (ev: MessageEvent) => {
      if (ev.origin !== location.origin || !ev.data || ev.data.type !== "elf-presentation-request") return;
      fetch("/api/investors/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(ev.data) }).catch(() => {});
    };
    window.addEventListener("message", onMsg);
    return () => { clearInterval(t); window.removeEventListener("message", onMsg); };
  }, [h]);
  return <iframe ref={ref} title="European Lifestyle Fund 1 simulator" src="/investors/simulator" style={{ width: "100%", height: h, border: 0, display: "block", background: "var(--paper)" }} />;
}
