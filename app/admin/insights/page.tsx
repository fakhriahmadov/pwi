import Link from "next/link";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { getFileArticles } from "@/lib/articles";
import { longDate } from "@/lib/format";
import { AdminNav } from "../AdminNav";
import { SaveButton } from "../about/fields";
import { importFileArticles } from "./actions";

export const metadata: Metadata = { title: "Admin — Insights", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminInsights({ searchParams }: { searchParams: Promise<{ ok?: string; status?: string }> }) {
  const sp = await searchParams;
  if (!dbConfigured()) return <section className="admin"><div className="wrap"><p className="notice err">Set DATABASE_URL and run <code>npm run db:push</code> to manage articles.</p></div></section>;
  const filter = sp.status === "draft" || sp.status === "published" ? sp.status : undefined;
  const [rows, counts] = await Promise.all([
    db.article.findMany({ where: filter ? { status: filter } : {}, orderBy: [{ date: "desc" }, { updatedAt: "desc" }], select: { id: true, title: true, topic: true, date: true, status: true, featured: true, slug: true, updatedAt: true } }),
    db.article.groupBy({ by: ["status"], _count: true }),
  ]);
  const n = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const inDb = new Set((await db.article.findMany({ select: { slug: true } })).map((a) => a.slug));
  const notImported = getFileArticles().filter((f) => !inDb.has(f.slug));

  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "24px", paddingTop: 40, maxWidth: 1100 }}>
        <div className="row between" style={{ alignItems: "center" }}>
          <h1 className="h2">Insights<span className="dot">.</span></h1>
          <Link className="btn btn-red" href="/admin/insights/new">New article</Link>
        </div>
        <AdminNav current="insights" />
        {sp.ok && <p className="notice okay" role="status">{sp.ok}.</p>}
        {notImported.length > 0 && (
          <form action={importFileArticles} className="notice row between" style={{ alignItems: "center" }}>
            <span>{notImported.length} original {notImported.length === 1 ? "article is" : "articles are"} on the site but not editable here yet.</span>
            <SaveButton>Make them editable</SaveButton>
          </form>
        )}
        <div className="row" style={{ ["--g" as string]: "8px" }}>
          <Link className="chip" aria-current={!filter ? "page" : undefined} href="/admin/insights">All ({n("draft") + n("published")})</Link>
          <Link className="chip" aria-current={filter === "published" ? "page" : undefined} href="/admin/insights?status=published">Published ({n("published")})</Link>
          <Link className="chip" aria-current={filter === "draft" ? "page" : undefined} href="/admin/insights?status=draft">Drafts ({n("draft")})</Link>
        </div>
        <div className="table-box" style={{ background: "var(--paper)" }}>
          <table className="table" style={{ fontSize: 14, minWidth: 720 }}>
            <thead><tr><th>Title</th><th>Topic</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td><Link href={`/admin/insights/${a.id}`} style={{ fontWeight: 500 }}>{a.title}</Link>{a.featured && <> <span className="pill PAID">Featured</span></>}</td>
                  <td>{a.topic}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{longDate(a.date)}</td>
                  <td><span className={`pill ${a.status === "published" ? "PAID" : "PENDING_APPROVAL"}`}>{a.status === "published" ? "Published" : "Draft"}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}><Link href={`/admin/insights/${a.id}`}>Edit</Link>{a.status === "published" && <> · <a href={`/insights/${a.slug}`} target="_blank">View ↗</a></>}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="muted">No articles here yet. Use “New article” to write one.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
