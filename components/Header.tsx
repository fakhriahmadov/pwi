"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "@/content/site";

export function Header() {
  const path = usePathname() || "/";
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]); // close after navigating
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <header className="site-header">
      <div className="inner">
        <Link href="/" className="logo" aria-label="Private Wealth Institute — home">
          Private<span className="dot">.</span>&nbsp;Wealth Institute
        </Link>
        <nav className="site-nav" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}>{n.label}</Link>
          ))}
        </nav>
        <button type="button" className="menu-btn" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        <nav id="mobile-nav" className="mobile-nav" aria-label="Main" hidden={!open}>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}>{n.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
