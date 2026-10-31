import Link from "next/link";
import { headers } from "next/headers";

const TABS = [
  { href: "/admin?tab=registrations", key: "registrations", label: "Registrations" },
  { href: "/admin?tab=enquiries", key: "enquiries", label: "Enquiries" },
  { href: "/admin?tab=subscribers", key: "subscribers", label: "Subscribers" },
  { href: "/admin/insights", key: "insights", label: "Insights" },
  { href: "/admin/about", key: "about", label: "About page" },
  { href: "/admin/account", key: "account", label: "Account" },
];

export async function AdminNav({ current, labels = {} }: { current: string; labels?: Record<string, string> }) {
  const email = (await headers()).get("x-admin-email");
  return (
    <div className="row between" style={{ alignItems: "center", ["--g" as string]: "12px 24px" }}>
      <nav className="row" aria-label="Admin sections" style={{ ["--g" as string]: "8px" }}>
        {TABS.map((t) => (
          <Link key={t.key} className="chip" aria-current={current === t.key ? "page" : undefined} href={t.href}>{labels[t.key] || t.label}</Link>
        ))}
      </nav>
      {email && (
        <form method="post" action="/api/auth/logout" className="row" style={{ ["--g" as string]: "12px", alignItems: "center", fontSize: 13 }}>
          <span className="muted">Signed in as {email}</span>
          <button className="chip">Sign out</button>
        </form>
      )}
    </div>
  );
}
