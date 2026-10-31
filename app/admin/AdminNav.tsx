import Link from "next/link";

const TABS = [
  { href: "/admin?tab=registrations", key: "registrations", label: "Registrations" },
  { href: "/admin?tab=enquiries", key: "enquiries", label: "Enquiries" },
  { href: "/admin?tab=subscribers", key: "subscribers", label: "Subscribers" },
  { href: "/admin/about", key: "about", label: "About page" },
];

export function AdminNav({ current, labels = {} }: { current: string; labels?: Record<string, string> }) {
  return (
    <nav className="row" aria-label="Admin sections" style={{ ["--g" as string]: "8px" }}>
      {TABS.map((t) => (
        <Link key={t.key} className="chip" aria-current={current === t.key ? "page" : undefined} href={t.href}>{labels[t.key] || t.label}</Link>
      ))}
    </nav>
  );
}
