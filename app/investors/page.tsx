import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/accounts";
import { longDate } from "@/lib/format";
import { confirmInvestor, withdrawInvestor } from "./actions";
import { COUNTRIES } from "./countries";
import { SimulatorFrame } from "./SimulatorFrame";
import { Select } from "@/components/Select";
import { getContent } from "@/lib/content";
import { InvestorExplainer, AccessSteps } from "./Explainer";
import { InvestorIcon } from "@/components/InvestorIcons";

export const metadata: Metadata = { title: "Investors", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const card: React.CSSProperties = { background: "var(--paper)", padding: "clamp(20px,4vw,36px)", display: "flex", flexDirection: "column", gap: 18 };
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--red)" };
const h1: React.CSSProperties = { margin: 0, fontFamily: "var(--font-display)", fontWeight: 400, letterSpacing: "-.03em", lineHeight: 1.05 };

/** Investor area: members only, after confirming investor status. */
export default async function Investors({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const sp = await searchParams;
  const me = await currentUser().catch(() => null);
  const inv = (me?.investor ?? null) as { confirmed?: string; country?: string } | null;
  const country = COUNTRIES.find(([c]) => c === inv?.country)?.[1];
  const c = await getContent("investors");

  if (me && inv?.confirmed) return (
    <div style={{ background: "var(--sand)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px clamp(16px,4vw,32px) 12px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px 20px", boxSizing: "border-box" }}>
        <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Investor area · {me.name || me.email}{country ? ` · ${country}` : ""} · confirmed {longDate(inv.confirmed)}</span>
        <span style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", fontSize: 13, alignItems: "center" }}>
          <a href="/investors/simulator" target="_blank" rel="noopener">Open full screen ↗</a>
          <form action={withdrawInvestor}><button style={{ background: "none", border: 0, padding: 0, font: "inherit", fontSize: 13, textDecoration: "underline", cursor: "pointer", color: "var(--ink)" }}>Withdraw my confirmation</button></form>
        </span>
      </div>
      <InvestorExplainer c={c} />
      <SimulatorFrame />
    </div>
  );

  return (
    <div style={{ background: "var(--sand)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(40px,7vw,88px) clamp(16px,4vw,32px) 96px", boxSizing: "border-box" }}>
        {!me ? (
          <div style={card}>
            <AccessSteps at={1} />
            <span style={eyebrow}>Investor area</span>
            <h1 style={{ ...h1, fontSize: "clamp(30px,6vw,44px)" }}>For members only<span className="dot">.</span></h1>
            <p style={{ margin: 0, color: "var(--ink-body)" }}>Investment material is shown only to signed-in members who confirm they are professional or well-informed investors.</p>
            <Link className="btn btn-dark" href="/signin?next=/investors" style={{ alignSelf: "flex-start" }}>Sign in</Link>
          </div>
        ) : (
          <form action={confirmInvestor} style={card}>
            <AccessSteps at={2} />
            <span style={eyebrow}>Investor area · before you continue</span>
            <h1 style={{ ...h1, fontSize: "clamp(28px,5.4vw,40px)" }}>European Lifestyle Fund 1<span className="dot">.</span></h1>
            <p style={{ margin: 0, color: "var(--ink-body)" }}>The next page contains material about an investment fund, for professional and well-informed investors only. Please confirm the following. Your answers are kept with your account.</p>
            {sp.msg && <p className="notice err" role="alert">{sp.msg}</p>}
            <div className="field" style={{ maxWidth: 360 }}><label htmlFor="inv-country">Country of residence</label>
              <Select id="inv-country" name="country" defaultValue="" placeholder="Choose…" options={COUNTRIES.map(([c, l]) => ({ value: c, label: l }))} /></div>
            <label style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, cursor: "pointer" }}><input type="checkbox" name="pro" style={{ width: 20, height: 20, margin: "1px 0 0", accentColor: "var(--ink)", flex: "none" }} /><span>I am a professional investor, or a well-informed investor investing at least €125,000 or assessed as able to understand the risks.</span></label>
            <label style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, cursor: "pointer" }}><input type="checkbox" name="terms" style={{ width: 20, height: 20, margin: "1px 0 0", accentColor: "var(--ink)", flex: "none" }} /><span>I understand this is not an offer or solicitation; any offer will be made only through final fund documents. Figures are illustrations, and I could lose all of my capital.</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 20px" }}><button className="btn btn-dark">Continue to the fund</button><Link href="/account" style={{ fontSize: 14 }}>Back to my account</Link></div>
          </form>
        )}
        <div className="inv-inside">
          <span style={eyebrow}>Inside the investor area</span>
          <ul>
            {[["building", "The fund", "One seasonal hotel on the Spanish coast — bought, repositioned, run for seven years and sold."], ["sliders", "A live simulator", "Change price, works, room rate, occupancy and debt, and see the returns move."], ["document", "Your scenario as a PDF", "Download what you modelled, or ask us for the full presentation."]].map(([ic, t, d]) => (
              <li key={t}><span className="inv-tip-ic"><InvestorIcon name={ic} size={20} /></span><span><b>{t}</b><span className="inv-tip-d">{d}</span></span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
