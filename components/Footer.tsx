import Link from "next/link";
import { site as base } from "@/content/site";
import { getContent } from "@/lib/content";
import { upcomingEvents } from "@/lib/events";
import { longDate } from "@/lib/format";

export async function Footer() {
  const site = { ...base, ...(await getContent("settings")) } as typeof base;
  const f = await getContent("footer");
  const up = await upcomingEvents();
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
            <span style={{ color: "var(--stone-2)", whiteSpace: "pre-line" }}>{site.address || "[Registered address]"}</span>
            <div className="row" style={{ marginTop: 8 }}>
              <a href={site.linkedin || "https://www.linkedin.com/"} className="social" aria-label="LinkedIn" target="_blank" rel="noopener"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" /></svg></a>
              <a href={site.instagram || "https://www.instagram.com/"} className="social" aria-label="Instagram" target="_blank" rel="noopener"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" /></svg></a>
            </div>
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
