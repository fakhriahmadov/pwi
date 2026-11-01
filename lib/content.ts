import { draftMode } from "next/headers";
import { db, dbConfigured } from "./db";
import { pageDef } from "./content-schema";
import { withDefaults, type Values } from "./fields";

export async function isPreview() {
  try { return (await draftMode()).isEnabled; } catch { return false; }
}

/** Content for a page: published values (or the draft while an admin previews), filled with defaults. */
export async function getContent<T extends Values = Values>(key: string): Promise<T> {
  const def = pageDef(key);
  const defaults = (def?.defaults ?? {}) as T;
  if (!dbConfigured()) return defaults;
  try {
    const row = await db.contentBlock.findUnique({ where: { key } });
    const preview = await isPreview();
    return withDefaults(defaults, preview ? row?.draft ?? row?.published : row?.published);
  } catch { return defaults; }
}

export type BlockStatus = "default" | "published" | "changes";
export function blockStatus(row: { draft: unknown; published: unknown } | null | undefined): BlockStatus {
  if (!row || (row.draft == null && row.published == null)) return "default";
  if (row.draft != null && JSON.stringify(row.draft) !== JSON.stringify(row.published)) return "changes";
  return "published";
}
