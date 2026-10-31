import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { getFileArticles } from "@/lib/articles";
import { mediaUrl } from "@/lib/about";
import { AdminNav } from "../../AdminNav";
import { ArticleEditor } from "./ArticleEditor";
import { deleteArticle } from "../actions";
import { DeleteButton } from "../../about/fields";

export const metadata: Metadata = { title: "Admin — Edit article", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditArticle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!dbConfigured()) notFound();
  const a = id === "new" ? null : await db.article.findUnique({ where: { id } });
  if (id !== "new" && !a) notFound();
  const topics = Array.from(new Set([...(await db.article.findMany({ select: { topic: true }, distinct: ["topic"] })).map((t) => t.topic), ...getFileArticles().map((f) => f.topic)])).sort();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "24px", paddingTop: 40, maxWidth: 1100 }}>
        <div className="row between" style={{ alignItems: "center" }}>
          <div className="stack" style={{ ["--g" as string]: "6px" }}>
            <Link href="/admin/insights" className="muted" style={{ fontSize: 13 }}>← All articles</Link>
            <h1 className="h2">{a ? "Edit article" : "New article"}<span className="dot">.</span></h1>
          </div>
          {a?.status === "published" && <a className="btn btn-ghost" href={`/insights/${a.slug}`} target="_blank">View on site ↗</a>}
        </div>
        <AdminNav current="insights" />
        {sp.ok && <p className="notice okay" role="status">{sp.ok}.{sp.ok === "Published" ? " It's live on the Insights page." : ""}</p>}
        {sp.error && <p className="notice err" role="alert">{sp.error}</p>}
        <ArticleEditor
          topics={topics}
          article={{
            id: a?.id ?? "", title: a?.title ?? "", slug: a?.slug ?? "", excerpt: a?.excerpt ?? "", topic: a?.topic ?? topics[0] ?? "Industries",
            author: a?.author ?? "Fakhri Ahmadov", date: a?.date ?? today, body: a?.body ?? "", cover: mediaUrl(a?.coverId),
            status: (a?.status as "draft" | "published") ?? "draft", featured: a?.featured ?? false,
          }}
        />
        {a && (
          <form action={deleteArticle} style={{ borderTop: "1px solid var(--line)", paddingTop: 20 }}>
            <input type="hidden" name="id" value={a.id} />
            <DeleteButton label="this article" />
          </form>
        )}
      </div>
    </section>
  );
}
