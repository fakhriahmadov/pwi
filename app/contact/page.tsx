import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contact", description: "Partnerships, press, speaking and research requests." };
const TOPICS = ["general", "partner", "press", "speak", "data"];

export default async function Contact({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const c = await getContent("contact");
  const site = (await getContent("settings")) as { email: string; pressEmail: string; address: string };
  const t = (await searchParams).topic;
  return (
    <>
      <section className="dark">
        <div className="wrap stack" style={{ ["--g" as string]: "20px" }}>
          <h1 className="display-xl">Contact<span className="dot">.</span></h1>
          <p className="lead">{String(c.lead)}</p>
        </div>
      </section>
      <section>
        <div className="wrap row" style={{ ["--g" as string]: "48px 80px", alignItems: "flex-start" }}>
          <ContactForm initialTopic={t && TOPICS.includes(t) ? t : "general"} />
          <aside className="stack min0" style={{ flex: "1 1 min(300px, 100%)", ["--g" as string]: "32px" }}>
            <div className="stack" style={{ ["--g" as string]: "8px", borderTop: "1px solid var(--ink)", paddingTop: 20 }}>
              <span className="label" style={{ color: "var(--ink-muted)" }}>General</span>
              <a href={`mailto:${site.email}`} className="h3" style={{ fontSize: 22, overflowWrap: "anywhere" }}>{site.email}</a>
            </div>
            {site.pressEmail && <div className="stack" style={{ ["--g" as string]: "8px", borderTop: "1px solid var(--line)", paddingTop: 20 }}><span className="label" style={{ color: "var(--ink-muted)" }}>Press</span><a href={`mailto:${site.pressEmail}`}>{site.pressEmail}</a></div>}
            {site.address && <div className="stack" style={{ ["--g" as string]: "8px", borderTop: "1px solid var(--line)", paddingTop: 20 }}><span className="label" style={{ color: "var(--ink-muted)" }}>Office</span><span style={{ whiteSpace: "pre-line" }}>{site.address}</span></div>}
            <div className="paper stack" style={{ padding: 24, ["--g" as string]: "10px" }}>
              <span className="h3" style={{ fontSize: 22 }}>{String(c.partnerTitle)}</span>
              <span style={{ fontSize: 14, color: "var(--ink-body)" }}>{String(c.partnerText)}</span>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
