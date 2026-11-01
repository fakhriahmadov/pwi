import Link from "next/link";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { PAGES } from "@/lib/content-schema";
import { blockStatus } from "@/lib/content";
import { AdminNav } from "../AdminNav";

export const metadata: Metadata = { title: "Admin — Pages", robots: { index: false } };
export const dynamic = "force-dynamic";

const LABEL = { default: ["Original text", "pill"], published: ["Published", "pill PAID"], changes: ["Unpublished changes", "pill PENDING_APPROVAL"] } as const;

export default async function AdminPages() {
  const rows = dbConfigured() ? await db.contentBlock.findMany() : [];
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const groups = ["Site", "Pages", "Legal"] as const;
  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "28px", paddingTop: 40, maxWidth: 1100 }}>
        <h1 className="h2">Pages<span className="dot">.</span></h1>
        <AdminNav current="pages" />
        <p className="muted" style={{ maxWidth: "70ch" }}>Edit the text and images on every page. Changes stay private until you publish them — use Preview to see them on the real page first.</p>
        {groups.map((g) => (
          <div key={g} className="stack" style={{ ["--g" as string]: "10px" }}>
            <h2 className="h3" style={{ fontSize: 20 }}>{g === "Site" ? "Across the site" : g === "Pages" ? "Pages" : "Legal pages"}</h2>
            <div className="table-box" style={{ background: "var(--white)", borderTop: 0 }}>
              <table className="table" style={{ fontSize: 14, minWidth: 640 }}>
                <tbody>
                  {PAGES.filter((p) => p.group === g).map((p) => {
                    const r = byKey.get(p.key); const st = blockStatus(r);
                    return (
                      <tr key={p.key}>
                        <td style={{ paddingLeft: 16 }}><Link href={`/admin/pages/${p.key}`} style={{ fontWeight: 500 }}>{p.label}</Link><br /><span className="muted" style={{ fontSize: 13 }}>{p.description}</span></td>
                        <td><span className={LABEL[st][1]}>{LABEL[st][0]}</span>{r?.updatedAt && <><br /><span className="muted" style={{ fontSize: 12 }}>Edited {r.updatedAt.toISOString().slice(0, 10)}{r.updatedBy ? ` by ${r.updatedBy.split("@")[0]}` : ""}</span></>}</td>
                        <td style={{ whiteSpace: "nowrap" }}><Link href={`/admin/pages/${p.key}`}>Edit</Link>{p.path && <> · <a href={p.path} target="_blank">View ↗</a></>}</td>
                      </tr>
                    );
                  })}
                  {g === "Pages" && (
                    <tr><td style={{ paddingLeft: 16 }}><Link href="/admin/about" style={{ fontWeight: 500 }}>About</Link><br /><span className="muted" style={{ fontSize: 13 }}>Introduction, founder, team, milestones and partners.</span></td><td><span className="pill">Own editor</span></td><td><Link href="/admin/about">Edit</Link> · <a href="/about" target="_blank">View ↗</a></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
