import { InvestorIcon } from "@/components/InvestorIcons";

type Item = { icon?: string; title?: string; text?: string };

/** "How the fund works" and "Using the simulator", above the simulator. Text and icons from Admin → Investors. */
export function InvestorExplainer({ c }: { c: Record<string, unknown> }) {
  const steps = ((c.steps as Item[]) || []).filter((s) => s.title);
  const tips = ((c.tips as Item[]) || []).filter((s) => s.title);
  return (
    <div className="inv-x">
      <div className="inv-x-head">
        <span className="inv-x-eyebrow">European Lifestyle Fund 1</span>
        <h1 className="inv-x-title">{String(c.introTitle || "How the fund works")}<span className="dot">.</span></h1>
        {c.introText ? <p className="inv-x-lead">{String(c.introText)}</p> : null}
      </div>
      {steps.length > 0 && (
        <ol className="inv-steps" aria-label="How the fund works">
          {steps.map((s, i) => (
            <li key={i} className="inv-step">
              <span className="inv-step-ic"><InvestorIcon name={s.icon || "chart"} size={26} /></span>
              <span className="inv-step-n">{String(i + 1).padStart(2, "0")}</span>
              <b className="inv-step-t">{s.title}</b>
              {s.text && <span className="inv-step-d">{s.text}</span>}
            </li>
          ))}
        </ol>
      )}
      {tips.length > 0 && (
        <div className="inv-tips">
          <span className="inv-x-eyebrow">Using the simulator</span>
          <ul>
            {tips.map((t, i) => (
              <li key={i}>
                <span className="inv-tip-ic"><InvestorIcon name={t.icon || "sliders"} size={20} /></span>
                <span><b>{t.title}</b>{t.text && <span className="inv-tip-d">{t.text}</span>}</span>
              </li>
            ))}
          </ul>
          {c.disclaimer ? <p className="inv-x-note"><InvestorIcon name="shield" size={16} /> {String(c.disclaimer)}</p> : null}
        </div>
      )}
    </div>
  );
}

/** Before access: the three steps to the investor area, with the current one highlighted. */
export function AccessSteps({ at }: { at: 1 | 2 }) {
  const s: [string, string, string][] = [["key", "Sign in", "With your member account"], ["shield", "Confirm", "Country and investor status"], ["sliders", "Explore", "The fund and its simulator"]];
  return (
    <ol className="inv-access" aria-label="Access to the investor area">
      {s.map(([ic, t, d], i) => (
        <li key={t} aria-current={i + 1 === at ? "step" : undefined} className={i + 1 < at ? "done" : ""}>
          <span className="inv-access-ic"><InvestorIcon name={i + 1 < at ? "check" : ic} size={20} /></span>
          <span><b>{t}</b><span>{d}</span></span>
        </li>
      ))}
    </ol>
  );
}
