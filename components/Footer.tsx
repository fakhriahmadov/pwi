import Link from "next/link";
import { site as base } from "@/content/site";
import { getContent } from "@/lib/content";
import { upcomingEvents } from "@/lib/events";
import { longDate } from "@/lib/format";

export async function Footer() {
  // Settings saved in Admin → Pages override the defaults, but an empty field never erases a default (e.g. the LinkedIn page).
  const saved = Object.fromEntries(Object.entries((await getContent("settings")) as Record<string, unknown>).filter(([, v]) => v !== "" && v != null));
  const site = { ...base, ...saved } as typeof base;
  const f = await getContent("footer");
  const up = await upcomingEvents();
  const ic = (d: React.ReactNode) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{d}</svg>;
  const s = site as unknown as Record<string, string>;
  const socials = [
    { key: "linkedin", label: "LinkedIn", icon: ic(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" /></>) },
    { key: "instagram", label: "Instagram", icon: ic(<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" /></>) },
    { key: "x", label: "X", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.75 3h3.07l-6.71 7.67L22 21h-6.18l-4.84-6.33L5.44 21H2.37l7.18-8.2L2 3h6.34l4.37 5.78L17.75 3zm-1.08 16.2h1.7L7.4 4.73H5.58L16.67 19.2z" /></svg> },
    { key: "youtube", label: "YouTube", icon: ic(<><rect x="2.5" y="5.5" width="19" height="13" rx="3.5" /><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" /></>) },
    { key: "facebook", label: "Facebook", icon: ic(<path d="M14 8h3V4.5h-3a4 4 0 0 0-4 4V11H7v3.5h3V21h3.5v-6.5H17l.5-3.5h-4V8.5A.5.5 0 0 1 14 8z" />) },
  ].filter((n) => /^https?:\/\//.test(String(s[n.key] || "").trim())).map((n) => ({ ...n, href: String(s[n.key]).trim() }));
  return (
    <footer className="site-footer">
      <div className="wrap stack" style={{ ["--g" as string]: "48px", paddingBottom: 32 }}>
        <div className="grid" style={{ ["--min" as string]: "200px", ["--g" as string]: "40px 32px" }}>
          <div className="stack" style={{ ["--g" as string]: "14px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 500, letterSpacing: "-.02em" }}>
              Private<span className="dot">.</span> Wealth Institute
            </span>
            <p style={{ color: "var(--stone-2)", maxWidth: "34ch" }}>
              {String(f.blurb)}
            </p>
          </div>
          <nav aria-label="Explore" className="stack" style={{ ["--g" as string]: "6px" }}>
            <span className="label">Explore</span>
            <Link href="/about">About</Link>
            <Link href="/insights">Insights</Link>
            <Link href="/insights#newsletter">Newsletter</Link>
            <Link href="/contact">Partnerships</Link>
          </nav>
          <nav aria-label="Events" className="stack" style={{ ["--g" as string]: "6px" }}>
            <span className="label">Future. Summit</span>
            {up.map((e) => (
              <Link key={e.slug} href={`/events/${e.slug}`}>
                {e.city} · {longDate(e.date).replace(/ (\w{3})\w* /, " $1 ")}
              </Link>
            ))}
            <Link href="/events#past">Past events</Link>
          </nav>
          <div className="stack" style={{ ["--g" as string]: "6px" }}>
            <span className="label">Contact</span>
            <a href={`mailto:${site.email}`} className="foot-mail">{site.email}</a>
            {site.address && <span style={{ color: "var(--stone-2)", whiteSpace: "pre-line" }}>{site.address}</span>}
            {socials.length > 0 && (
              <div className="row" style={{ marginTop: 8, ["--g" as string]: "8px" }}>
                {socials.map((n) => (
                  <a key={n.key} href={n.href} className="social" aria-label={n.label} title={n.label} target="_blank" rel="noopener">{n.icon}</a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} {site.name}</span>
          <div className="row" style={{ ["--g" as string]: "8px 24px" }}>
            <Link href="/legal/imprint">Imprint</Link>
            <Link href="/legal/privacy">Privacy policy</Link>
            <Link href="/legal/cookies">Cookie settings</Link>
            <Link href="/legal/terms">Terms of registration</Link>
            <Link href="/signin">Sign in · My account</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
