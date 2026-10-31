import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "About", description: site.tagline };
const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;

const team: { name: string; role: string; photo?: string }[] = [
  // Add team members and advisors here; the section hides while this is empty.
];

export default function About() {
  return (
    <>
      <section className="dark">
        <div className="wrap grid" style={{ ...v("--min", "340px"), ...v("--g", "40px 96px"), alignItems: "end" }}>
          <h1 className="display-xl">About<span className="dot">.</span></h1>
          <div className="stack" style={v("--g", "20px")}>
            <p className="lead">The Private Wealth Institute studies how private wealth is created, kept and passed on — across industries, countries and generations.</p>
            <p className="muted">We publish research and commentary for owners of large businesses, maintain the EuroCapital Index, and host Future. Summit — private conversations in the places that set the tone.</p>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap stack" style={v("--g", "40px")}>
          <div className="stack" style={v("--g", "10px")}>
            <span className="kicker">Our approach</span>
            <h2 className="h2" style={{ maxWidth: "20ch" }}>Wealth is a story about entrepreneurs, not just numbers.</h2>
          </div>
          <ul className="grid" style={{ listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid var(--line)", ...v("--g", "0 32px"), ...v("--min", "260px") }}>
            {[
              ["By industry", "Which sectors create fortunes, which lose them, and how shocks like COVID test each one."],
              ["By country", "How national economies, policy and capital markets shape who builds wealth — from Spain to China."],
              ["By generation", "Self-made versus inherited, founders and successors — and the rise of self-made women."],
            ].map(([t, d]) => (
              <li key={t} className="stack" style={{ padding: "28px 0", borderBottom: "1px solid var(--line)", ...v("--g", "12px") }}>
                <h3 className="h3" style={{ fontSize: 26 }}>{t}</h3>
                <p style={{ color: "var(--ink)" }}>{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="paper">
        <div className="wrap grid" style={{ ...v("--min", "320px"), ...v("--g", "40px 96px"), alignItems: "center" }}>
          <div className="ph" style={{ aspectRatio: "4/5", maxWidth: 520, fontSize: 13, fontFamily: "var(--body)", color: "var(--muted)" }}>Portrait — add /public/team/fakhri-ahmadov.jpg</div>
          <div className="stack" style={v("--g", "20px")}>
            <span className="kicker">Leadership</span>
            <h2 className="h2-big">Fakhri Ahmadov</h2>
            <p style={{ color: "var(--ink)", maxWidth: "52ch" }}>Author of the institute's research on billionaire wealth across industries, countries and generations.</p>
            <div><Link className="btn btn-dark" href="/insights">Read the articles →</Link></div>
          </div>
        </div>
      </section>

      {team.length > 0 && (
        <section>
          <div className="wrap stack" style={v("--g", "32px")}>
            <div className="stack" style={v("--g", "10px")}><span className="kicker">Team &amp; advisors</span><h2 className="h2">The people behind the research</h2></div>
            <div className="grid" style={{ ...v("--min", "220px"), ...v("--g", "32px 24px") }}>
              {team.map((p) => (
                <div key={p.name} className="stack" style={v("--g", "10px")}>
                  {p.photo ? <img src={p.photo} alt="" style={{ aspectRatio: "1/1", objectFit: "cover" }} /> : <div className="ph" style={{ aspectRatio: "1/1" }} />}
                  <span className="h3" style={{ fontSize: 20 }}>{p.name}</span><span className="muted" style={{ fontSize: 13 }}>{p.role}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="dark">
        <div className="wrap stack" style={v("--g", "40px")}>
          <div className="stack" style={v("--g", "10px")}><span className="kicker">Milestones</span><h2 className="h2">From articles to a convening</h2></div>
          <ol className="grid" style={{ listStyle: "none", margin: 0, padding: 0, ...v("--min", "240px"), ...v("--g", "32px") }}>
            {[
              ["2018", "First published research — entrepreneurship in the gaming and casino industry."],
              ["2020", "Series on billionaires by country, industry and gender — Spain, China, cosmetics."],
              ["2026", "Future. Summit Vienna at The Ritz-Carlton — ten conversations and Fashion Night."],
              ["2027", "Future. Summit Ibiza at Hotel Aguas de Ibiza."],
            ].map(([y, t]) => (
              <li key={y} className="fact"><span className="fact-big" style={{ fontSize: 48 }}>{y}</span><span style={{ color: "var(--ondark-2)" }}>{t}</span></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sand">
        <div className="wrap tight row between" style={v("--g", "24px 48px")}>
          <h2 className="h2-big" style={{ maxWidth: "14ch" }}>Work with the institute<span className="dot">.</span></h2>
          <div className="row"><Link className="btn btn-red" href="/contact?topic=partner">Partnerships →</Link><Link className="btn btn-dark" href="/contact?topic=press">Press enquiries</Link></div>
        </div>
      </section>
    </>
  );
}
