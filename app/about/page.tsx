import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/content/site";
import { getAbout } from "@/lib/about";

export const metadata: Metadata = { title: "About", description: site.tagline };
const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;

function Person({ p }: { p: Awaited<ReturnType<typeof getAbout>>["team"][number] }) {
  return (
    <div className="stack" style={v("--g", "10px")}>
      {p.photo ? <img src={p.photo} alt={p.name} loading="lazy" style={{ aspectRatio: "1/1", objectFit: "cover", width: "100%" }} /> : <div className="ph" style={{ aspectRatio: "1/1" }} aria-hidden="true" />}
      <span className="h3" style={{ fontSize: 20 }}>{p.linkedin ? <a href={p.linkedin} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{p.name}</a> : p.name}</span>
      {p.role && <span className="muted" style={{ fontSize: 13 }}>{p.role}</span>}
      {p.bio && <p style={{ fontSize: 14, color: "var(--ink-body)" }}>{p.bio}</p>}
    </div>
  );
}

export default async function About() {
  const a = await getAbout();
  const team = a.team.filter((t) => t.group !== "advisor");
  const advisors = a.team.filter((t) => t.group === "advisor");
  const partners = a.partners.filter((p) => p.kind !== "press");
  const press = a.partners.filter((p) => p.kind === "press");
  return (
    <>
      <section className="dark">
        <div className="wrap grid" style={{ ...v("--min", "340px"), ...v("--g", "40px 96px"), alignItems: "end" }}>
          <h1 className="display-xl">About<span className="dot">.</span></h1>
          <div className="stack" style={v("--g", "20px")}>
            <p className="lead">{a.intro}</p>
            <p className="muted">{a.subIntro}</p>
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
                <p style={{ color: "var(--ink-body)" }}>{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="paper">
        <div className="wrap grid" style={{ ...v("--min", "320px"), ...v("--g", "40px 96px"), alignItems: "center" }}>
          {a.founder.photo
            ? <img src={a.founder.photo} alt={`Portrait of ${a.founder.name}`} style={{ aspectRatio: "4/5", objectFit: "cover", width: "100%", maxWidth: 520 }} />
            : <div className="ph" style={{ aspectRatio: "4/5", maxWidth: 520 }} aria-hidden="true" />}
          <div className="stack" style={v("--g", "20px")}>
            <span className="kicker">Leadership</span>
            <h2 className="h2-big">{a.founder.name}</h2>
            {a.founder.role && <span className="h3" style={{ fontSize: 19 }}>{a.founder.role}</span>}
            <p style={{ color: "var(--ink-body)", maxWidth: "52ch", whiteSpace: "pre-line" }}>{a.founder.bio}</p>
            {a.founder.quote && <blockquote style={{ margin: "8px 0 0", fontFamily: "var(--font-display)", fontSize: "clamp(20px,2.4vw,24px)", lineHeight: 1.3, maxWidth: "30ch" }}>“{a.founder.quote}”</blockquote>}
            <div><Link className="btn btn-dark" href="/insights">Read the articles →</Link></div>
          </div>
        </div>
      </section>

      {a.team.length > 0 && (
        <section>
          <div className="wrap stack" style={v("--g", "48px")}>
            {team.length > 0 && (
              <div className="stack" style={v("--g", "32px")}>
                <div className="stack" style={v("--g", "10px")}><span className="kicker">Team</span><h2 className="h2">The people behind the research</h2></div>
                <div className="grid" style={{ ...v("--min", "200px"), ...v("--g", "32px 24px") }}>{team.map((p) => <Person key={p.id} p={p} />)}</div>
              </div>
            )}
            {advisors.length > 0 && (
              <div className="stack" style={v("--g", "32px")}>
                <div className="stack" style={v("--g", "10px")}><span className="kicker">Advisory board</span><h2 className="h2">Advisors</h2></div>
                <div className="grid" style={{ ...v("--min", "200px"), ...v("--g", "32px 24px") }}>{advisors.map((p) => <Person key={p.id} p={p} />)}</div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="dark">
        <div className="wrap stack" style={v("--g", "40px")}>
          <div className="stack" style={v("--g", "10px")}><span className="kicker">Milestones</span><h2 className="h2">From articles to a convening</h2></div>
          <ol className="grid" style={{ listStyle: "none", margin: 0, padding: 0, ...v("--min", "220px"), ...v("--g", "32px") }}>
            {a.milestones.map((m) => (
              <li key={m.id} className="fact"><span className="fact-big" style={{ fontSize: 48 }}>{m.year}</span><span style={{ color: "var(--stone)" }}>{m.text}</span></li>
            ))}
          </ol>
        </div>
      </section>

      {a.partners.length > 0 && (
        <section>
          <div className="wrap tight stack" style={v("--g", "40px")}>
            {[["Partners", partners], ["Featured in", press]].filter(([, l]) => (l as typeof partners).length).map(([title, list]) => (
              <div key={title as string} className="stack" style={v("--g", "20px")}>
                <span className="kicker">{title as string}</span>
                <div className="grid" style={{ ...v("--min", "150px"), ...v("--g", "12px") }}>
                  {(list as typeof partners).map((p) => {
                    const inner = p.logo
                      ? <img src={p.logo} alt={p.name} loading="lazy" style={{ maxWidth: "70%", maxHeight: 56, objectFit: "contain" }} />
                      : <span style={{ fontFamily: "var(--font-display)", fontWeight: 500, textAlign: "center" }}>{p.name}</span>;
                    const box: React.CSSProperties = { height: 104, background: "var(--sand)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, textDecoration: "none" };
                    return p.url ? <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" style={box} aria-label={p.name}>{inner}</a> : <div key={p.id} style={box}>{inner}</div>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="sand">
        <div className="wrap tight row between" style={v("--g", "24px 48px")}>
          <h2 className="h2-big" style={{ maxWidth: "14ch" }}>Work with the institute<span className="dot">.</span></h2>
          <div className="row"><Link className="btn btn-red" href="/contact?topic=partner">Partnerships →</Link><Link className="btn btn-dark" href="/contact?topic=press">Press enquiries</Link></div>
        </div>
      </section>
    </>
  );
}
