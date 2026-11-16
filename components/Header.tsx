"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "@/content/site";

type Next = { city: string; href: string; external: boolean } | null;

export function Header({ next }: { next: Next }) {
  const path = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<{ role: string; initials: string; name: string; email: string } | null>(null);
  useEffect(() => { fetch("/api/me", { cache: "no-store" }).then((r) => r.json()).then(setMe).catch(() => setMe(null)); }, [path]);
  const items = me ? [...nav, { href: "/investors", label: "Investors" }] : nav;
  const accountHref = me ? (me.role === "admin" ? "/admin" : "/account") : "/signin";
  const accountLabel = me ? (me.role === "admin" ? "Admin" : "My account") : "Sign in";
  useEffect(() => setOpen(false), [path]); // close after navigating
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <header className="site-header">
      <div className="inner">
        <Link href="/" className="logo" aria-label="Private Wealth Institute — home">
          Private<span className="dot">.</span>&nbsp;Wealth Institute
        </Link>
        <nav className="site-nav" aria-label="Main">
          {items.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}>{n.label}</Link>
          ))}
        </nav>
        <div className="head-actions">
          <Link href={accountHref} className="signin-btn" aria-label={me ? `${accountLabel} — ${me.email}` : "Sign in"} title={accountLabel}>
            {me ? <span className={`head-av${me.role === "admin" ? " is-admin" : ""}`}>{me.initials}</span>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>}
            <span className="signin-label">{accountLabel}</span>
          </Link>
          {next && <RegBtn next={next} className="reg-btn" />}
        </div>
        <button type="button" className="menu-btn" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
          <span className="menu-label">{open ? "Close" : "Menu"}</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        <nav id="mobile-nav" className="mobile-nav" aria-label="Main" hidden={!open}>
          {items.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}>{n.label}</Link>
          ))}
          <Link href={accountHref} className="mobile-signin">{me ? `${accountLabel} · ${me.name || me.email}` : "Sign in or create an account"}</Link>
          {next && <RegBtn next={next} className="reg-btn reg-btn-wide" />}
        </nav>
      </div>
    </header>
  );
}

function RegBtn({ next, className }: { next: NonNullable<Next>; className: string }) {
  const label = `Register · ${next.city}`;
  return next.external
    ? <a href={next.href} className={className} target="_blank" rel="noopener">{label}</a>
    : <Link href={next.href} className={className}>{label}</Link>;
}
