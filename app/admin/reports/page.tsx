import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { longDate } from "@/lib/format";
import { AdminNav } from "../AdminNav";
import { UploadReport } from "./UploadReport";

export const metadata: Metadata = { title: "Admin — Reports", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const sp = await searchParams;
  if (!dbConfigured()) return <section className="admin"><div className="wrap"><p className="notice err">Set DATABASE_URL to manage reports.</p></div></section>;
  const rows = await db.report.findMany({ orderBy: [{ date: "desc" }] });
  const sizes = new Map((await db.media.findMany({ where: { id: { in: rows.map((r) => r.fileId) } }, select: { id: true, size: true } })).map((m) => [m.id, m.size]));
  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "24px", paddingTop: 40, maxWidth: 1100 }}>
        <h1 className="h2">Reports<span className="dot">.</span></h1>
        <AdminNav current="reports" />
        <p className="muted" style={{ maxWidth: "70ch" }}>PDF reports shown under “Editions &amp; studies” on the Indexes page. Gated reports ask for an email address before the download appears.</p>
        {sp.ok && <p className="notice okay" role="status">Saved.</p>}
        <UploadReport />
        <div className="table-box" style={{ background: "var(--white)" }}>
          <table className="table" style={{ fontSize: 14, minWidth: 760 }}>
            <thead><tr><th style={{ paddingLeft: 16 }}>Report</th><th>Date</th><th>Download</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ paddingLeft: 16 }}><a href={`/media/${r.fileId}`} target="_blank" style={{ fontWeight: 500 }}>{r.title}</a><br /><span className="muted">PDF{r.pages ? ` · ${r.pages} pages` : ""}{sizes.get(r.fileId) ? ` · ${(sizes.get(r.fileId)! / 1048576).toFixed(1)} MB` : ""}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>{longDate(r.date)}</td>
                  <td>{r.gated ? "Email required" : "Open"}</td>
                  <td><span className={`pill ${r.status === "published" ? "PAID" : "PENDING_APPROVAL"}`}>{r.status === "published" ? "Published" : "Draft"}</span></td>
                  <td>
                    <form method="post" action={`/api/admin/reports/${r.id}`} className="row" style={{ ["--g" as string]: "6px" }}>
                      <button className="chip" name="action" value={r.status === "published" ? "unpublish" : "publish"}>{r.status === "published" ? "Unpublish" : "Publish"}</button>
                      <button className="chip" name="action" value={r.gated ? "ungate" : "gate"}>{r.gated ? "Make open" : "Require email"}</button>
                      <button className="chip" name="action" value="delete">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="muted" style={{ paddingLeft: 16 }}>No reports yet. Upload the first one above.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
