/** Field definitions shared by the page editor, the events manager and the settings form. */
export type Field =
  | { key: string; label: string; type: "text" | "textarea" | "markdown" | "url" | "email" | "date" | "time" | "number"; help?: string; placeholder?: string }
  | { key: string; label: string; type: "image"; help?: string; shape?: "wide" | "portrait" | "square" | "logo" }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; help?: string }
  | { key: string; label: string; type: "tags"; help?: string; placeholder?: string }
  | { key: string; label: string; type: "list"; itemLabel: string; fields: Field[]; help?: string; max?: number };

export type Section = { title: string; help?: string; fields: Field[] };
export type Values = Record<string, unknown>;

/** Fills missing keys from defaults (shallow; lists are taken whole). */
export function withDefaults<T extends Values>(defaults: T, v: unknown): T {
  const out = { ...defaults } as Values;
  if (v && typeof v === "object") for (const [k, val] of Object.entries(v as Values)) if (val !== undefined && val !== null && val !== "") out[k] = val;
  return out as T;
}
