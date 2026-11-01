"use client";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { renderMarkdown } from "@/lib/markdown";
import { ImageField } from "../../about/fields";
import { saveArticle } from "../actions";

type A = { id: string; title: string; slug: string; excerpt: string; topic: string; author: string; date: string; body: string; cover: string | null; status: "draft" | "published"; featured: boolean };

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
const v = (k: string, val: string) => ({ [k]: val }) as React.CSSProperties;

export function ArticleEditor({ article, topics }: { article: A; topics: string[] }) {
  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(article.slug));
  const [body, setBody] = useState(article.body);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [newTopic, setNewTopic] = useState(false);
  const [upload, setUpload] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const intentRef = useRef<HTMLInputElement>(null);
  const words = body.split(/\s+/).filter(Boolean).length;

  function wrap(before: string, after = "", placeholder = "") {
    const el = area.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = body.slice(s, e) || placeholder;
    const next = body.slice(0, s) + before + sel + after + body.slice(e);
    setBody(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); });
  }
  function linePrefix(prefix: string) {
    const el = area.current; if (!el) return;
    const s = body.lastIndexOf("\n", el.selectionStart - 1) + 1;
    setBody(body.slice(0, s) + prefix + body.slice(s));
    requestAnimationFrame(() => el.focus());
  }
  async function insertImage(f: File) {
    setUpload("Uploading image…");
    const fd = new FormData(); fd.append("file", f);
    try {
      const r = await fetch("/api/admin/media", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok || !j.url) { setUpload(j.message || "The upload failed."); return; }
      wrap(`\n![`, `](${j.url})\n`, "Describe the image");
      setUpload(null);
    } catch { setUpload("The upload failed. Check your connection and try again."); }
  }

  const tool = (label: string, title: string, on: () => void) => (
    <button type="button" className="chip" onClick={on} title={title} aria-label={title} style={{ minWidth: 44, justifyContent: "center", padding: "0 12px", background: "var(--sand)" }}>{label}</button>
  );
  const card: React.CSSProperties = { background: "var(--paper)", padding: "clamp(20px,3vw,32px)", display: "flex", flexDirection: "column", gap: 18 };

  return (
    <form action={saveArticle} className="row" style={{ ...v("--g", "24px"), alignItems: "flex-start" }}>
      <input type="hidden" name="id" value={article.id} />
      <input type="hidden" name="body" value={body} />
      <input type="hidden" name="intent" ref={intentRef} defaultValue="save" />

      <div className="stack min0" style={{ flex: "2 1 min(620px,100%)", ...v("--g", "24px") }}>
        <div style={card}>
          <div className="field"><label htmlFor="a-title">Title</label>
            <input id="a-title" name="title" className="input" required value={title} style={{ fontSize: 22, fontFamily: "var(--font-display)" }}
              onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} /></div>
          <div className="field"><label htmlFor="a-excerpt">Summary</label>
            <textarea id="a-excerpt" name="excerpt" className="input" rows={2} defaultValue={article.excerpt} placeholder="One or two sentences shown on the Insights page and in search results" /></div>
        </div>

        <div style={card}>
          <div className="row between" style={{ alignItems: "center" }}>
            <div className="row" role="tablist" aria-label="Editor" style={v("--g", "8px")}>
              <button type="button" role="tab" aria-selected={tab === "write"} className="chip" aria-pressed={tab === "write"} onClick={() => setTab("write")}>Write</button>
              <button type="button" role="tab" aria-selected={tab === "preview"} className="chip" aria-pressed={tab === "preview"} onClick={() => setTab("preview")}>Preview</button>
            </div>
            <span className="muted" style={{ fontSize: 13 }}>{words} words · about {Math.max(1, Math.round(words / 220))} min read</span>
          </div>
          {tab === "write" ? (
            <>
              <div className="row" role="toolbar" aria-label="Formatting" style={v("--g", "6px")}>
                {tool("H2", "Section heading", () => linePrefix("## "))}
                {tool("H3", "Sub-heading", () => linePrefix("### "))}
                {tool("B", "Bold", () => wrap("**", "**", "bold text"))}
                {tool("I", "Italic", () => wrap("_", "_", "italic text"))}
                {tool("“ ”", "Quote", () => linePrefix("> "))}
                {tool("•", "Bulleted list", () => linePrefix("- "))}
                {tool("1.", "Numbered list", () => linePrefix("1. "))}
                {tool("Link", "Insert link", () => wrap("[", "](https://)", "link text"))}
                <label className="chip" style={{ cursor: "pointer", background: "var(--sand)" }}>
                  Image
                  <input type="file" accept="image/*" className="hp" onChange={(e) => { const f = e.target.files?.[0]; if (f) insertImage(f); e.target.value = ""; }} />
                </label>
              </div>
              {upload && <p className="notice" role="status" style={{ fontSize: 13 }}>{upload}</p>}
              <label htmlFor="a-body" className="hp">Article text</label>
              <textarea id="a-body" ref={area} className="input" rows={22} value={body} onChange={(e) => setBody(e.target.value)}
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 15, lineHeight: 1.7 }}
                placeholder={"Write the article here.\n\n## A section heading\n\nParagraphs are separated by an empty line. Use the buttons above for headings, bold, quotes, lists, links and images."} />
              <p className="muted" style={{ fontSize: 12 }}>Formatting uses Markdown: **bold**, _italic_, ## heading, &gt; quote, - list. Use Preview to check how it will look.</p>
            </>
          ) : (
            <div className="prose" style={{ maxWidth: "none", minHeight: 300 }} dangerouslySetInnerHTML={{ __html: body.trim() ? renderMarkdown(body) : "<p>Nothing written yet.</p>" }} />
          )}
        </div>
      </div>

      <aside className="stack min0" style={{ flex: "1 1 min(300px,100%)", ...v("--g", "24px") }}>
        <div style={card}>
          <div className="row" style={{ alignItems: "center", ...v("--g", "8px") }}>
            <span className="label-s">Status</span>
            <span className={`pill ${article.status === "published" ? "PAID" : "PENDING_APPROVAL"}`}>{article.status === "published" ? "Published" : "Draft"}</span>
          </div>
          <div className="row" style={v("--g", "8px")}>
            <SubmitAs intentRef={intentRef} intent="publish" label={article.status === "published" ? "Update" : "Publish"} primary />
            <SubmitAs intentRef={intentRef} intent={article.status === "published" ? "draft" : "save"} label={article.status === "published" ? "Unpublish" : "Save draft"} />
          </div>
          <label className="check"><input type="checkbox" name="featured" defaultChecked={article.featured} />Feature at the top of the Insights page</label>
        </div>
        <div style={card}>
          <ImageField name="cover" removeName="removeCover" label="Cover image" shape="logo" current={article.cover} />
          <p className="muted" style={{ fontSize: 12 }}>Wide images (about 2400×1000) work best. Without one, the topic name is shown instead.</p>
        </div>
        <div style={card}>
          <div className="field"><label htmlFor="a-topic">Topic</label>
            {newTopic
              ? <input id="a-topic" name="topicNew" className="input" placeholder="New topic name" autoFocus />
              : <select id="a-topic" name="topic" className="input" defaultValue={article.topic}>{topics.map((t) => <option key={t}>{t}</option>)}</select>}
            <button type="button" onClick={() => setNewTopic(!newTopic)} style={{ alignSelf: "flex-start", background: "none", border: 0, padding: 0, minHeight: 32, font: "inherit", fontSize: 13, textDecoration: "underline", cursor: "pointer" }}>{newTopic ? "Choose an existing topic" : "+ New topic"}</button>
          </div>
          <div className="field"><label htmlFor="a-date">Publication date</label><input id="a-date" name="date" type="date" required className="input" defaultValue={article.date} /></div>
          <div className="field"><label htmlFor="a-author">Author</label><input id="a-author" name="author" className="input" defaultValue={article.author} /></div>
          <div className="field"><label htmlFor="a-slug">Web address</label>
            <input id="a-slug" name="slug" className="input" value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} />
            <span className="muted" style={{ fontSize: 12, overflowWrap: "anywhere" }}>/insights/{slug || "…"}</span></div>
        </div>
      </aside>
    </form>
  );
}

/** Submit button that tells the server whether to publish, unpublish or just save. */
function SubmitAs({ intent, label, primary, intentRef }: { intent: string; label: string; primary?: boolean; intentRef: React.RefObject<HTMLInputElement | null> }) {
  const { pending } = useFormStatus();
  return (
    <button data-intent={intent} className={`btn ${primary ? "btn-red" : "btn-ghost"}`} disabled={pending}
      onClick={() => { if (intentRef.current) intentRef.current.value = intent; }}>
      {pending ? "Saving…" : label}
    </button>
  );
}
