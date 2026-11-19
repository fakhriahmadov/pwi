import Link from "next/link";
import { headers } from "next/headers";
import { db, dbConfigured } from "@/lib/db";
import { Suspense } from "react";
import { AdminBusy } from "./AdminBusy";

type Tab = { href: string; key: string; label: string; icon: string; count?: "news" | "registrations" | "enquiries" | "insights" };
const GROUPS: { title?: string; tabs: Tab[] }[] = [
  { tabs: [{ href: "/admin", key: "home", label: "Overview", icon: "home" }, { href: "/", key: "site", label: "View website", icon: "ext" }] },
  { title: "Content", tabs: [
    { href: "/admin/pages", key: "pages", label: "Pages", icon: "page" },
    { href: "/admin/news", key: "news", label: "News", icon: "news", count: "news" },
    { href: "/admin/insights", key: "insights", label: "Insights", icon: "pen", count: "insights" },
    { href: "/admin/research", key: "research", label: "Indexes", icon: "chart" },
    { href: "/admin/events", key: "events", label: "Events", icon: "calendar" },
    { href: "/admin/reports", key: "reports", label: "Reports", icon: "file" },
    { href: "/admin/about", key: "about", label: "About page", icon: "info" },
    { href: "/admin/pages/investors", key: "investors", label: "Investors", icon: "briefcase" },
  ] },
  { title: "People", tabs: [
    { href: "/admin?tab=registrations", key: "registrations", label: "Registrations", icon: "ticket", count: "registrations" },
    { href: "/admin?tab=enquiries", key: "enquiries", label: "Enquiries", icon: "inbox", count: "enquiries" },
    { href: "/admin?tab=subscribers", key: "subscribers", label: "Subscribers", icon: "users" },
    { href: "/admin/newsletter", key: "newsletter", label: "Newsletter", icon: "mail" },
    { href: "/admin?tab=accounts", key: "accounts", label: "Accounts", icon: "key" },
  ] },
];

const P: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  page: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
  news: "M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5M8 16h3",
  pen: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  chart: "M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  file: "M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h4",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.01",
  briefcase: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
  ticket: "M3 8V6h18v2a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4v0H3v-4a2 2 0 0 0 0-4zM14 6v12",
  inbox: "M4 13l2-8h12l2 8M4 13v6h16v-6h-5a3 3 0 0 1-6 0z",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2 .7 3 2.8 3 6",
  mail: "M3 5h18v14H3zM3.5 6l8.5 7 8.5-7",
  key: "M14 10a4 4 0 1 0-3.9 4H11l1.5 1.5L14 14l1.5 1.5L17 14l3 3v3h-3",
  out: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  ext: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  arrow: "M5 12h14M13 6l6 6-6 6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8",
};
export function AdminIcon({ name, size = 18 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[name] ?? P.page} /></svg>;
}

async function counts() {
  if (!dbConfigured()) return {};
  try {
    const [news, registrations, enquiries, insights] = await Promise.all([
      db.newsStory.count({ where: { status: "draft" } }),
      db.registration.count({ where: { OR: [{ status: { in: ["PENDING_APPROVAL", "ENQUIRY"] } }, { requestType: { not: null } }] } }),
      db.enquiry.count({ where: { handled: false } }),
      db.article.count({ where: { status: "draft" } }),
    ]);
    return { news, registrations, enquiries, insights } as Record<string, number>;
  } catch { return {}; }
}

/** The admin menu: a fixed panel on the left on wide screens, a menu button at the top on phones and tablets. Numbers show what is waiting. */
export async function AdminNav({ current }: { current: string; labels?: Record<string, string> }) {
  const email = (await headers()).get("x-admin-email");
  const n = await counts();
  const initials = (email ?? "A").split("@")[0].split(/[._-]/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("") || "A";
  const nav = (
    <>
      {GROUPS.map((g, i) => (
        <nav key={i} aria-label={g.title ?? "Admin"} className="adm-group">
          {g.title && <span className="adm-group-t">{g.title}</span>}
          {g.tabs.map((t) => {
            const c = t.count ? n[t.count] ?? 0 : 0;
            return (
              <Link key={t.key} href={t.href} className="adm-link" aria-current={current === t.key ? "page" : undefined} target={t.key === "site" ? "_blank" : undefined}>
                <AdminIcon name={t.icon} /><span>{t.label}</span>{c > 0 && <b className="adm-badge" title={`${c} waiting`}>{c}</b>}
              </Link>
            );
          })}
        </nav>
      ))}
    </>
  );
  const foot = email && (
    <div className="adm-foot">
      <span className="adm-av" aria-hidden="true">{initials}</span>
      <span className="adm-me-t"><b>Signed in</b><span title={email}>{email}</span></span>
      <Link href="/admin/account" className="adm-ib" title="My account" aria-label="My account" aria-current={current === "account" ? "page" : undefined}><AdminIcon name="user" size={17} /></Link>
      <form method="post" action="/api/auth/logout"><button className="adm-ib" title="Sign out" aria-label="Sign out"><AdminIcon name="out" size={17} /></button></form>
    </div>
  );
  const brand = <Link href="/admin" className="adm-brand"><span>Private<i>.</i> Wealth Institute</span><small>Admin</small></Link>;
  const all = GROUPS.flatMap((g) => g.tabs);
  const quick = ["home", "pages", "news", "events", "registrations"].map((k) => all.find((t) => t.key === k)!);
  const short: Record<string, string> = { home: "Overview", registrations: "People" };
  return (
    <>
      <Suspense fallback={null}><AdminBusy /></Suspense>
      <aside className="adm-side" aria-label="Admin menu">
        {brand}
        <div className="adm-scroll">{nav}</div>
        {foot}
      </aside>

      {/* Phones and tablets: the same black header as the website, a full-screen menu, and a tab bar at the bottom */}
      <div className="adm-hdr">
        <Link href="/admin" className="logo" aria-label="Admin overview">Private<span className="dot">.</span>&nbsp;Wealth Institute</Link>
        <Link href="/admin/account" className="adm-hdr-av" title={email ?? "My account"} aria-label="My account">{initials}</Link>
        <details className="adm-menu">
          <summary className="menu-btn">
            <span className="menu-label adm-l-open">Menu</span><span className="menu-label adm-l-close">Close</span>
            <svg className="adm-l-open" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            <svg className="adm-l-close" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </summary>
          <div className="adm-sheet">
            {nav}
            {foot}
          </div>
        </details>
      </div>
      <nav className="adm-tabbar" aria-label="Quick links">
        {quick.map((t) => {
          const c = t.count ? n[t.count] ?? 0 : 0;
          const on = current === t.key || (t.key === "registrations" && ["enquiries", "subscribers", "accounts", "newsletter"].includes(current));
          return (
            <Link key={t.key} href={t.href} aria-current={on ? "page" : undefined}>
              <span className="adm-tab-ic"><AdminIcon name={t.icon} size={21} />{c > 0 && <b>{c > 9 ? "9+" : c}</b>}</span>
              <span>{short[t.key] ?? t.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
