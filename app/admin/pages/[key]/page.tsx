import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { pageDef } from "@/lib/content-schema";
import { blockStatus } from "@/lib/content";
import { withDefaults } from "@/lib/fields";
import { AdminNav } from "../../AdminNav";
import { SchemaForm } from "@/components/admin/SchemaForm";

export const metadata: Metadata = { title: "Admin — Edit page", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const def = pageDef(key);
  if (!def) notFound();
  const row = dbConfigured() ? await db.contentBlock.findUnique({ where: { key } }) : null;
  const st = blockStatus(row);
  const initial = withDefaults(def.defaults, row?.draft ?? row?.published);
  const pill = st === "changes" ? <span className="pill PENDING_APPROVAL">Unpublished changes</span> : st === "published" ? <span className="pill PAID">Published</span> : <span className="pill">Original text</span>;
  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "20px", paddingTop: 40, maxWidth: 1000 }}>
        <div className="stack" style={{ ["--g" as string]: "6px" }}>
          <Link href="/admin/pages" className="muted" style={{ fontSize: 13 }}>← All pages</Link>
          <h1 className="h2">{def.label}<span className="dot">.</span></h1>
          <p className="muted">{def.description}{def.path && <> · <a href={def.path} target="_blank">View live page ↗</a></>}</p>
        </div>
        <AdminNav current="pages" />
        {!dbConfigured() ? <p className="notice err">Set DATABASE_URL to edit pages.</p> : (
          <SchemaForm sections={def.sections} initial={initial} endpoint={`/api/admin/content/${key}`} previewPath={def.path} status={pill}
            buttons={[
              { action: "draft", label: "Save draft", variant: "quiet" },
              ...(st === "changes" ? [{ action: "discard", label: "Discard draft", variant: "quiet" as const, confirm: "Throw away unpublished changes?" }] : []),
              ...(st !== "default" ? [{ action: "reset", label: "Reset to original", variant: "quiet" as const, confirm: "Go back to the original text on the live site?" }] : []),
              { action: "publish", label: "Publish", variant: "primary" },
            ]} />
        )}
      </div>
    </section>
  );
}
