import Link from "next/link";
import { headers } from "next/headers";

const GROUPS: { title: string; tabs: { href: string; key: string; label: string }[] }[] = [
  { title: "Content", tabs: [
    { href: "/admin/pages", key: "pages", label: "Pages" },
    { href: "/admin/insights", key: "insights", label: "Insights" },
    { href: "/admin/research", key: "research", label: "Indexes" },
    { href: "/admin/events", key: "events", label: "Events" },
    { href: "/admin/reports", key: "reports", label: "Reports" },
    { href: "/admin/about", key: "about", label: "About page" },
  ] },
  { title: "People", tabs: [
    { href: "/admin?tab=registrations", key: "registrations", label: "Registrations" },
    { href: "/admin?tab=enquiries", key: "enquiries", label: "Enquiries" },
    { href: "/admin?tab=subscribers", key: "subscribers", label: "Subscribers" },
  ] },
];

export async function AdminNav({ current, labels = {} }: { current: string; labels?: Record<string, string> }) {
  const email = (await headers()).get("x-admin-email");
  return (
    <div className="stack" style={{ ["--g" as string]: "10px", borderBottom: "1px solid var(--line)", paddingBottom: 16 }}>
      <div className="row between" style={{ alignItems: "center", ["--g" as string]: "8px 24px" }}>
        <Link href="/admin" className="chip" aria-current={current === "home" ? "page" : undefined}>Overview</Link>
        {email && (
          <form method="post" action="/api/auth/logout" className="row" style={{ ["--g" as string]: "10px", alignItems: "center", fontSize: 13 }}>
            <span className="muted">Signed in as {email}</span>
            <Link className="chip" href="/admin/account" aria-current={current === "account" ? "page" : undefined}>Account</Link>
            <button className="chip">Sign out</button>
          </form>
        )}
      </div>
      {GROUPS.map((g) => (
        <nav key={g.title} aria-label={g.title} className="row" style={{ ["--g" as string]: "6px", alignItems: "center" }}>
          <span className="label-s muted" style={{ width: 64 }}>{g.title}</span>
          {g.tabs.map((t) => <Link key={t.key} className="chip" aria-current={current === t.key ? "page" : undefined} href={t.href}>{labels[t.key] || t.label}</Link>)}
        </nav>
      ))}
    </div>
  );
}
