import Link from "next/link";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { FREQUENCIES, buildDraft, renderDigest, isFrequency, frequencyLabel, type Draft } from "@/lib/newsletter";
import { longDate } from "@/lib/format";
import { AdminNav } from "../AdminNav";
import { saveEdition } from "./actions";

export const metadata: Metadata = { title: "Admin · Newsletter", robots: { index: false } };
export const dynamic = "force-dynamic";

const statusText = (d: Draft) => d.status === "sent" ? `Sent ${d.sentAt ? longDate(d.sentAt.toISOString().slice(0, 10)) : ""} to ${d.recipients}` : d.status === "skipped" ? "Skipped" : d.items.length ? "Waiting for your approval" : "Nothing new — skip it";

export default async function NewsletterAdmin({ searchParams }: { searchParams: Promise<{ f?: string; msg?: string }> }) {
  const sp = await searchParams;
  if (!dbConfigured()) return <section className="admin"><div className="wrap"><p className="notice err">Set DATABASE_URL and run <code>npm run db:push</code> to use the newsletter.</p></div></section>;
  const drafts = await Promise.all(FREQUENCIES.map((f) => buildDraft(f.id)));
  const cur = drafts.find((d) => d.frequency === (isFrequency(sp.f) ? sp.f : null)) ?? drafts.find((d) => d.status === "draft" && d.items.length) ?? drafts[1];
  const included = cur.items.filter((i) => !cur.excluded.includes(i.key));
  const history = await db.newsletterIssue.findMany({ where: { status: { in: ["sent", "skipped"] } }, orderBy: { updatedAt: "desc" }, take: 20 });
  const [active, pending] = await Promise.all([
    db.subscriber.count({ where: { confirmedAt: { not: null }, unsubscribed: false } }),
    db.subscriber.count({ where: { confirmedAt: null, unsubscribed: false } }),
  ]);
  const waiting = drafts.filter((d) => d.status === "draft" && d.items.length).length;

  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "24px", paddingTop: 40 }}>
        <h1 className="h2">Newsletter<span className="dot">.</span></h1>
        <AdminNav current="newsletter" />
        <p className="muted" style={{ maxWidth: "75ch" }}>
          Subscribers choose how often they hear from us and what to include. Each edition collects new articles, index updates and upcoming events since the last one — event news only ever goes out here, never as separate invitations. <b>Nothing is sent until you approve it.</b>
        </p>
        {sp.msg && <p className="notice okay" role="status">{sp.msg}</p>}

        <div className="grid" style={{ ["--min" as string]: "200px", ["--g" as string]: "12px" }}>
          {[["Confirmed subscribers", String(active)], ["Awaiting confirmation", String(pending)], ["Editions to approve", String(waiting)]].map(([l, n]) => (
            <div key={l} className="stack" style={{ background: "var(--paper)", padding: 18, borderTop: "2px solid var(--ink)", ["--g" as string]: "4px" }}><span className="muted" style={{ fontSize: 12 }}>{l}</span><span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 300 }}>{n}</span></div>
          ))}
        </div>

        <nav className="row" aria-label="Editions" style={{ ["--g" as string]: "8px" }}>
          {drafts.map((d) => (
            <Link key={d.frequency} className="chip" aria-current={d === cur ? "page" : undefined} href={`/admin/newsletter?f=${d.frequency}`} style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "center", padding: "8px 16px", minHeight: 64 }}>
              <span>{d.label} · {d.recipients} {d.recipients === 1 ? "reader" : "readers"}</span>
              <span style={{ fontSize: 12, fontWeight: 400, opacity: .8 }}>Due {longDate(d.dueDate)} · {statusText(d)}</span>
            </Link>
          ))}
        </nav>

        <div className="grid" style={{ ["--min" as string]: "420px", ["--g" as string]: "24px", alignItems: "start" }}>
          <form action={saveEdition} className="stack" style={{ background: "var(--paper)", padding: "clamp(20px,3vw,32px)", ["--g" as string]: "18px" }}>
            <input type="hidden" name="frequency" value={cur.frequency} />
            <div className="stack" style={{ ["--g" as string]: "4px" }}>
              <h2 className="h3">{cur.label} edition · {longDate(cur.dueDate)}</h2>
              <span className="muted" style={{ fontSize: 13 }}>New since {longDate(cur.since)} · goes to {cur.recipients} confirmed {cur.recipients === 1 ? "subscriber" : "subscribers"} · next edition {longDate(cur.nextDate)}</span>
            </div>
            {cur.status !== "draft" ? <p className="notice">{statusText(cur)}. The next {cur.label.toLowerCase()} edition is due on {longDate(cur.nextDate)}.</p> : (
              <>
                <div className="field"><label htmlFor="nl-subject">Subject</label><input id="nl-subject" name="subject" className="input" defaultValue={cur.subject} /></div>
                <div className="field"><label htmlFor="nl-intro">Opening line</label><textarea id="nl-intro" name="intro" className="input" rows={2} defaultValue={cur.intro} /></div>
                <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
                  <legend className="label-s muted" style={{ marginBottom: 8 }}>Included ({included.length} of {cur.items.length}) — untick to leave out</legend>
                  {cur.items.length === 0 && <p className="muted">Nothing new since the last edition. Skip this one — it costs your readers nothing.</p>}
                  {cur.items.map((i) => (
                    <label key={i.key} className="row" style={{ ["--g" as string]: "12px", alignItems: "flex-start", flexWrap: "nowrap", padding: "12px 0", borderTop: "1px solid var(--line)", cursor: "pointer" }}>
                      <input type="checkbox" name="include" value={i.key} defaultChecked={!cur.excluded.includes(i.key)} style={{ width: 20, height: 20, marginTop: 2, flex: "none", accentColor: "var(--ink)" }} />
                      <span className="stack min0" style={{ ["--g" as string]: "2px" }}>
                        <span className="label-s muted">{i.label} · {i.topic === "events" ? "Events" : "Insights"}</span>
                        <b style={{ fontWeight: 500 }}>{i.title}</b>
                        <span className="muted" style={{ fontSize: 13 }}>{i.sub}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <div className="row" style={{ ["--g" as string]: "10px", alignItems: "center" }}>
                  <button className="btn btn-red" name="intent" value="send" disabled={!cur.items.length}>Approve &amp; send to {cur.recipients}</button>
                  <button className="btn btn-ghost" name="intent" value="save">Save &amp; refresh preview</button>
                  <button className="btn btn-ghost" name="intent" value="skip">Skip this edition</button>
                </div>
                <p className="muted" style={{ fontSize: 12 }}>Each reader only gets the items for the topics they chose, with their own “change preferences” and “unsubscribe” links.</p>
              </>
            )}
          </form>

          <div className="stack" style={{ ["--g" as string]: "8px" }}>
            <span className="label-s muted">Email preview · a reader with both topics</span>
            <iframe title="Email preview" srcDoc={renderDigest(cur, included)} style={{ width: "100%", height: 720, border: 0, background: "#F6F2EA" }} />
          </div>
        </div>

        <div className="stack" style={{ ["--g" as string]: "10px" }}>
          <h2 className="h3">History</h2>
          <div className="table-box" style={{ background: "var(--paper)" }}>
            <table className="table" style={{ fontSize: 14 }}>
              <thead><tr><th>Edition</th><th>Due</th><th>Subject</th><th>Result</th></tr></thead>
              <tbody>
                {history.map((h) => <tr key={h.id}><td>{frequencyLabel(h.frequency)}</td><td>{longDate(h.dueDate)}</td><td>{h.subject}</td><td>{h.status === "sent" ? `Sent to ${h.recipients}${h.by ? ` · by ${h.by}` : ""}` : "Skipped"}</td></tr>)}
                {history.length === 0 && <tr><td colSpan={4} className="muted">No editions sent yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
