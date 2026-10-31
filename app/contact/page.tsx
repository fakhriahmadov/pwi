import type { Metadata } from "next";
import { site } from "@/content/site";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contact", description: "Partnerships, press, speaking and research requests." };
const TOPICS = ["general", "partner", "press", "speak", "data"];

export default async function Contact({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const t = (await searchParams).topic;
  return (
    <>
      <section className="dark">
        <div className="wrap stack" style={{ ["--g" as string]: "20px" }}>
          <h1 className="display-xl">Contact<span className="dot">.</span></h1>
          <p className="lead">Partnerships, press, speaking and research requests — tell us what you have in mind.</p>
        </div>
      </section>
      <section>
        <div className="wrap row" style={{ ["--g" as string]: "48px 80px", alignItems: "flex-start" }}>
          <ContactForm initialTopic={t && TOPICS.includes(t) ? t : "general"} />
          <aside className="stack min0" style={{ flex: "1 1 300px", ["--g" as string]: "32px" }}>
            <div className="stack" style={{ ["--g" as string]: "8px", borderTop: "1px solid var(--black)", paddingTop: 20 }}>
              <span className="label" style={{ color: "var(--muted)" }}>General</span>
              <a href={`mailto:${site.email}`} className="h3" style={{ fontSize: 22 }}>{site.email}</a>
            </div>
            {site.pressEmail && <div className="stack" style={{ ["--g" as string]: "8px", borderTop: "1px solid var(--line)", paddingTop: 20 }}><span className="label" style={{ color: "var(--muted)" }}>Press</span><a href={`mailto:${site.pressEmail}`}>{site.pressEmail}</a></div>}
            {site.address && <div className="stack" style={{ ["--g" as string]: "8px", borderTop: "1px solid var(--line)", paddingTop: 20 }}><span className="label" style={{ color: "var(--muted)" }}>Office</span><span style={{ whiteSpace: "pre-line" }}>{site.address}</span></div>}
            <div className="paper stack" style={{ padding: 24, ["--g" as string]: "10px" }}>
              <span className="h3" style={{ fontSize: 22 }}>Partner a Future. Summit</span>
              <span style={{ fontSize: 14, color: "var(--ink)" }}>Brand presence, hosted tables and conversations at our summits. Choose “Partnership &amp; sponsorship” in the form.</span>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
