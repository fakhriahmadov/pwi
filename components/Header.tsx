"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav } from "@/content/site";

export function Header() {
  const path = usePathname() || "/";
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <header className="site-header">
      <div className="inner">
        <Link href="/" className="logo" aria-label="Private Wealth Institute — home">
          Private<span className="dot">.</span>&nbsp;Wealth Institute
        </Link>
        <nav className="site-nav" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
