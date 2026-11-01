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
            <Link href="/insights/articles">All articles</Link>
            <Link href="/insights#newsletter">Newsletter</Link>
            <Link href="/contact">Partnerships</Link>
          </nav>
          <nav aria-label="Events" className="stack" style={{ ["--g" as string]: "6px" }}>
            <span className="label">Future. Summit</span>
            {up.map((e) => (
              <Link key={e.slug} href={`/events/${e.slug}`}>
                {e.city} · {longDate(e.date)}
              </Link>
            ))}
            <Link href="/events#past">Past events</Link>
          </nav>
          <div className="stack" style={{ ["--g" as string]: "6px" }}>
            <span className="label">Contact</span>
            <a href={`mailto:${site.email}`} style={{ color: "var(--paper)" }}>{site.email}</a>
            {site.address && <span style={{ color: "var(--stone-2)", whiteSpace: "pre-line" }}>{site.address}</span>}
            <div className="row" style={{ marginTop: 8 }}>
              {site.linkedin && <a href={site.linkedin}>LinkedIn</a>}
              {site.instagram && <a href={site.instagram}>Instagram</a>}
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} {site.name}</span>
          <div className="row" style={{ ["--g" as string]: "8px 24px" }}>
            <Link href="/legal/imprint">Imprint</Link>
            <Link href="/legal/privacy">Privacy policy</Link>
            <Link href="/legal/cookies">Cookies</Link>
            <Link href="/legal/terms">Terms of registration</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
