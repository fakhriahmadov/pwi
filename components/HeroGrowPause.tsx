"use client";
import { useEffect, useRef } from "react";

/** Pauses the hero animation while it is off screen (and therefore costs nothing while people read the page). */
export function HeroGrowPause() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const box = ref.current?.parentElement;
    if (!box || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => box.classList.toggle("hg-paused", !e.isIntersecting), { threshold: 0 });
    io.observe(box);
    return () => io.disconnect();
  }, []);
  return <span ref={ref} hidden />;
}
