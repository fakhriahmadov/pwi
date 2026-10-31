import { Marked } from "marked";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const safeUrl = (u: string) => (/^(https?:|mailto:|\/)/i.test(u.trim()) ? u.trim() : "#");

/** Markdown → HTML. Raw HTML in the text is shown as text, and links/images only allow safe URLs. */
const md = new Marked({
  gfm: true,
  renderer: {
    html({ text }) { return esc(text); },
    link({ href, title, tokens }) {
      const inner = this.parser.parseInline(tokens);
      const ext = /^https?:/i.test(href);
      return `<a href="${esc(safeUrl(href))}"${title ? ` title="${esc(title)}"` : ""}${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${inner}</a>`;
    },
    image({ href, title, text }) {
      return `<figure><img src="${esc(safeUrl(href))}" alt="${esc(text)}" loading="lazy">${title ? `<figcaption>${esc(title)}</figcaption>` : ""}</figure>`;
    },
  },
});

export const renderMarkdown = (s: string) => md.parse(s || "", { async: false }) as string;

export function readTime(s: string) {
  const words = (s || "").replace(/[#>*_`[\]()!-]/g, " ").split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min`;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
