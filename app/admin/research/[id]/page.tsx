import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db, dbConfigured } from "@/lib/db";
import { computeIndex, tagCounts } from "@/lib/indexes";
import { AdminNav } from "../../AdminNav";
import { IndexForm } from "./IndexForm";
import { deleteIndex } from "../actions";
import { DeleteButton } from "../../about/fields";

export const metadata: Metadata = { title: "Admin — Edit index", robots: { index: false } };
export const dynamic = "force-dynamic";
const nf = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });

export default async function EditIndex({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params; const sp = await searchParams;
  if (!dbConfigured()) notFound();
  const def = id === "new" ? null : await db.indexDef.findUnique({ where: { id } });
  if (id !== "new" && !def) notFound();
  const [tags, yearsRaw] = await Promise.all([tagCounts(), db.fortune.groupBy({ by: ["year"], orderBy: { year: "asc" } })]);
  const years = yearsRaw.map((y) => y.year);
  const result = def ? await computeIndex(def) : null;

  return (
    <section className="admin">
      <div className="wrap stack" style={{ ["--g" as string]: "24px", paddingTop: 40, maxWidth: 1100 }}>
        <div className="row between" style={{ alignItems: "center" }}>
          <div className="stack" style={{ ["--g" as string]: "6px" }}>
            <Link href="/admin/research#indexes" className="muted" style={{ fontSize: 13 }}>← All indexes</Link>
            <h1 className="h2">{def ? def.name : "New index"}<span className="dot">.</span></h1>
          </div>
          {def?.published && <a className="btn btn-ghost" href={`/research/${def.slug}`} target="_blank">View on site ↗</a>}
        </div>
        <AdminNav current="research" />
        {sp.ok && <p className="notice okay" role="status">{sp.ok}.</p>}
        {sp.error && <p className="notice err" role="alert">{sp.error}</p>}
        {result && (
          <div className="notice" style={{ display: "flex", flexWrap: "wrap", gap: "8px 28px", fontSize: 14 }}>
            <b style={{ fontWeight: 500 }}>With the saved rule:</b>
            {result.latest ? <>
              <span>{result.latest.count.toLocaleString("en")} fortunes in {result.latest.year}</span>
              <span>€{nf.format(result.latest.wealthBn)} bn combined</span>
              <span>Level {nf.format(result.latest.level)} (base {result.baseYear} = 100)</span>
              {result.changePct != null && <span>{result.changePct >= 0 ? "+" : ""}{nf.format(result.changePct)}% vs {result.previous?.year}</span>}
            </> : <span>no fortunes match yet.</span>}
          </div>
        )}
        <IndexForm tags={tags} years={years} def={{
          id: def?.id ?? "", name: def?.name ?? "", slug: def?.slug ?? "", description: def?.description ?? "",
          allTags: def?.allTags ?? [], anyTags: def?.anyTags ?? [], baseYear: def?.baseYear ?? null, color: def?.color ?? "#C42F33",
          published: def?.published ?? false, featured: def?.featured ?? false, order: def?.order ?? 0,
        }} />
        {def && <form action={deleteIndex} style={{ borderTop: "1px solid var(--line)", paddingTop: 20 }}><input type="hidden" name="id" value={def.id} /><DeleteButton label="this index" /></form>}
      </div>
    </section>
  );
}
