import Link from "next/link";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { ABOUT_DEFAULTS, mediaUrl } from "@/lib/about";
import { AdminNav } from "../AdminNav";
import { ImageField, SaveButton, DeleteButton } from "./fields";
import * as A from "./actions";

export const metadata: Metadata = { title: "Admin — About page", robots: { index: false } };
export const dynamic = "force-dynamic";

const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;
const card: React.CSSProperties = { background: "var(--white)", padding: "clamp(20px,3vw,32px)", display: "flex", flexDirection: "column", gap: 20 };

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="stack" style={{ ...v("--g", "16px"), scrollMarginTop: 24 }}>
      <div className="stack" style={v("--g", "4px")}>
        <h2 className="h3" style={{ fontSize: 26 }}>{title}</h2>
        {hint && <p className="muted" style={{ fontSize: 14, maxWidth: "70ch" }}>{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function AdminAbout({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  if (!dbConfigured())
    return <section className="admin"><div className="wrap"><p className="notice err">Set DATABASE_URL and run <code>npm run db:push</code> to edit the About page.</p></div></section>;

  const [c, team, milestones, partners] = await Promise.all([
    db.aboutContent.findUnique({ where: { id: "about" } }),
    db.teamMember.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    db.milestone.findMany({ orderBy: [{ order: "asc" }, { year: "asc" }] }),
    db.partner.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
  ]);
  const d = ABOUT_DEFAULTS;

  return (
    <section className="admin">
      <div className="wrap stack" style={{ ...v("--g", "40px"), paddingTop: 40, maxWidth: 1100 }}>
        <div className="stack" style={v("--g", "16px")}>
          <div className="row between" style={{ alignItems: "center" }}>
            <h1 className="h2">About page<span className="dot">.</span></h1>
            <Link className="btn btn-ghost" href="/about" target="_blank">View the About page ↗</Link>
          </div>
          <AdminNav current="about" />
          {sp.ok && <p className="notice okay" role="status">{sp.ok}. The About page is updated.</p>}
          {sp.error && <p className="notice err" role="alert">{sp.error}</p>}
          <nav aria-label="On this page" className="row" style={{ ...v("--g", "4px 20px"), fontSize: 14 }}>
            <a href="#intro">Introduction</a><a href="#founder">Founder</a><a href="#team">Team &amp; advisors</a><a href="#milestones">Milestones</a><a href="#partners">Partners &amp; press</a>
          </nav>
        </div>

        <Section id="intro" title="Introduction" hint="The two paragraphs at the top of the About page.">
          <form action={A.saveIntro} style={card}>
            <div className="field"><label htmlFor="intro">Main statement</label><textarea id="intro" name="intro" className="input" rows={3} defaultValue={c?.intro || d.intro} /></div>
            <div className="field"><label htmlFor="subIntro">Supporting paragraph</label><textarea id="subIntro" name="subIntro" className="input" rows={4} defaultValue={c?.subIntro || d.subIntro} /></div>
            <div><SaveButton>Save introduction</SaveButton></div>
          </form>
        </Section>

        <Section id="founder" title="Founder" hint="Shown in the Leadership section with a portrait. Portrait photos (4:5) look best.">
          <form action={A.saveFounder} style={card}>
            <div className="row" style={{ ...v("--g", "24px 32px"), alignItems: "flex-start" }}>
              <ImageField name="photo" removeName="removePhoto" label="Portrait" current={mediaUrl(c?.founderPhotoId)} />
              <div className="stack min0" style={{ flex: "1 1 min(420px,100%)", ...v("--g", "16px") }}>
                <div className="row" style={v("--g", "16px")}>
                  <div className="field"><label htmlFor="f-name">Name</label><input id="f-name" name="name" className="input" defaultValue={c?.founderName || d.founder.name} /></div>
                  <div className="field"><label htmlFor="f-role">Role</label><input id="f-role" name="role" className="input" placeholder="e.g. Founder & Director" defaultValue={c?.founderRole ?? ""} /></div>
                </div>
                <div className="field"><label htmlFor="f-bio">Biography</label><textarea id="f-bio" name="bio" className="input" rows={5} defaultValue={c?.founderBio || d.founder.bio} /></div>
                <div className="field"><label htmlFor="f-quote">Quote (optional)</label><textarea id="f-quote" name="quote" className="input" rows={2} placeholder="A sentence in your own words on what the institute is for" defaultValue={c?.founderQuote ?? ""} /></div>
              </div>
            </div>
            <div><SaveButton>Save founder</SaveButton></div>
          </form>
        </Section>

        <Section id="team" title="Team & advisors" hint="The section appears on the About page once you add the first person. Lower order numbers appear first.">
          {team.map((m) => (
            <div key={m.id} style={card}>
              <form action={A.saveMember} className="stack" style={v("--g", "16px")}>
                <input type="hidden" name="id" value={m.id} />
                <MemberFields m={m} />
                <div><SaveButton>Save</SaveButton></div>
              </form>
              <form action={A.deleteMember}><input type="hidden" name="id" value={m.id} /><DeleteButton label={m.name} /></form>
            </div>
          ))}
          <form action={A.saveMember} style={{ ...card, border: "1px dashed var(--field)" }}>
            <span className="kicker">Add a person</span>
            <MemberFields m={{ order: team.length }} />
            <div><SaveButton>Add person</SaveButton></div>
          </form>
        </Section>

        <Section id="milestones" title="Milestones" hint="The timeline in the black band. Lower order numbers appear first.">
          {milestones.length === 0 ? (
            <form action={A.importDefaultMilestones} style={card}>
              <p style={{ fontSize: 14 }}>The page currently shows these built-in milestones. Make them editable to change or reorder them:</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>{d.milestones.map((m) => <li key={m.id}><b>{m.year}</b> — {m.text}</li>)}</ul>
              <input type="hidden" name="rows" value={JSON.stringify(d.milestones.map(({ year, text }) => ({ year, text })))} />
              <div><SaveButton>Make editable</SaveButton></div>
            </form>
          ) : (
            milestones.map((m) => (
              <div key={m.id} style={{ ...card, flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end" }}>
                <form action={A.saveMilestone} className="row min0" style={{ ...v("--g", "12px 16px"), alignItems: "flex-end", flex: "1 1 min(600px,100%)" }}>
                  <input type="hidden" name="id" value={m.id} />
                  <MilestoneFields m={m} />
                  <SaveButton>Save</SaveButton>
                </form>
                <form action={A.deleteMilestone}><input type="hidden" name="id" value={m.id} /><DeleteButton label={m.year} /></form>
              </div>
            ))
          )}
          <form action={A.saveMilestone} className="row" style={{ ...card, flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", border: "1px dashed var(--field)" }}>
            <MilestoneFields m={{ order: milestones.length || d.milestones.length }} />
            <SaveButton>Add milestone</SaveButton>
          </form>
        </Section>

        <Section id="partners" title="Partners & press" hint="Logos appear in the Partners & press strip once you add the first one. Transparent PNG or SVG logos look best.">
          {partners.map((p) => (
            <div key={p.id} style={card}>
              <form action={A.savePartner} className="stack" style={v("--g", "16px")}>
                <input type="hidden" name="id" value={p.id} />
                <PartnerFields p={p} />
                <div><SaveButton>Save</SaveButton></div>
              </form>
              <form action={A.deletePartner}><input type="hidden" name="id" value={p.id} /><DeleteButton label={p.name} /></form>
            </div>
          ))}
          <form action={A.savePartner} style={{ ...card, border: "1px dashed var(--field)" }}>
            <span className="kicker">Add a partner or publication</span>
            <PartnerFields p={{ order: partners.length }} />
            <div><SaveButton>Add</SaveButton></div>
          </form>
        </Section>
      </div>
    </section>
  );
}

type MemberLike = { id?: string; name?: string; role?: string | null; bio?: string | null; group?: string; linkedin?: string | null; photoId?: string | null; order?: number };
function MemberFields({ m }: { m: MemberLike }) {
  const k = m.id || "new";
  return (
    <div className="row" style={{ ...v("--g", "24px 32px"), alignItems: "flex-start" }}>
      <ImageField name="photo" removeName="removePhoto" label="Photo" shape="square" current={mediaUrl(m.photoId)} />
      <div className="stack min0" style={{ flex: "1 1 min(420px,100%)", ...v("--g", "14px") }}>
        <div className="row" style={v("--g", "14px")}>
          <div className="field"><label htmlFor={`m-name-${k}`}>Name</label><input id={`m-name-${k}`} name="name" className="input" required defaultValue={m.name ?? ""} /></div>
          <div className="field"><label htmlFor={`m-role-${k}`}>Role</label><input id={`m-role-${k}`} name="role" className="input" defaultValue={m.role ?? ""} placeholder="e.g. Head of Research" /></div>
        </div>
        <div className="row" style={v("--g", "14px")}>
          <div className="field"><label htmlFor={`m-group-${k}`}>Group</label><select id={`m-group-${k}`} name="group" className="input" defaultValue={m.group ?? "team"}><option value="team">Team</option><option value="advisor">Advisory board</option></select></div>
          <div className="field"><label htmlFor={`m-li-${k}`}>LinkedIn (optional)</label><input id={`m-li-${k}`} name="linkedin" type="url" className="input" defaultValue={m.linkedin ?? ""} placeholder="https://www.linkedin.com/in/…" /></div>
          <div className="field" style={{ flex: "0 1 100px" }}><label htmlFor={`m-order-${k}`}>Order</label><input id={`m-order-${k}`} name="order" type="number" className="input" defaultValue={m.order ?? 0} /></div>
        </div>
        <div className="field"><label htmlFor={`m-bio-${k}`}>Short bio (optional)</label><textarea id={`m-bio-${k}`} name="bio" className="input" rows={3} defaultValue={m.bio ?? ""} /></div>
      </div>
    </div>
  );
}

function MilestoneFields({ m }: { m: { id?: string; year?: string; text?: string; order?: number } }) {
  const k = m.id || "new";
  return (
    <>
      <div className="field" style={{ flex: "0 1 110px" }}><label htmlFor={`y-${k}`}>Year</label><input id={`y-${k}`} name="year" className="input" required defaultValue={m.year ?? ""} /></div>
      <div className="field" style={{ flex: "1 1 min(360px,100%)" }}><label htmlFor={`t-${k}`}>What happened</label><input id={`t-${k}`} name="text" className="input" required defaultValue={m.text ?? ""} /></div>
      <div className="field" style={{ flex: "0 1 90px" }}><label htmlFor={`o-${k}`}>Order</label><input id={`o-${k}`} name="order" type="number" className="input" defaultValue={m.order ?? 0} /></div>
    </>
  );
}

function PartnerFields({ p }: { p: { id?: string; name?: string; kind?: string; url?: string | null; logoId?: string | null; order?: number } }) {
  const k = p.id || "new";
  return (
    <div className="row" style={{ ...v("--g", "24px 32px"), alignItems: "flex-start" }}>
      <ImageField name="logo" removeName="removeLogo" label="Logo" shape="logo" current={mediaUrl(p.logoId)} />
      <div className="stack min0" style={{ flex: "1 1 min(420px,100%)", ...v("--g", "14px") }}>
        <div className="row" style={v("--g", "14px")}>
          <div className="field"><label htmlFor={`p-name-${k}`}>Name</label><input id={`p-name-${k}`} name="name" className="input" required defaultValue={p.name ?? ""} /></div>
          <div className="field"><label htmlFor={`p-kind-${k}`}>Type</label><select id={`p-kind-${k}`} name="kind" className="input" defaultValue={p.kind ?? "partner"}><option value="partner">Partner</option><option value="press">Press / featured in</option></select></div>
        </div>
        <div className="row" style={v("--g", "14px")}>
          <div className="field"><label htmlFor={`p-url-${k}`}>Website (optional)</label><input id={`p-url-${k}`} name="url" type="url" className="input" defaultValue={p.url ?? ""} placeholder="https://…" /></div>
          <div className="field" style={{ flex: "0 1 100px" }}><label htmlFor={`p-order-${k}`}>Order</label><input id={`p-order-${k}`} name="order" type="number" className="input" defaultValue={p.order ?? 0} /></div>
        </div>
      </div>
    </div>
  );
}
