import { db } from "./db";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/avif", "image/gif"];

export class UploadError extends Error {}

/** Stores an uploaded image; returns its id, or undefined when the input was empty. */
export async function storeImage(f: FormDataEntryValue | null): Promise<string | undefined> {
  if (!f || typeof f === "string" || f.size === 0) return undefined;
  if (!IMAGE_TYPES.includes(f.type)) throw new UploadError("Images must be JPG, PNG, WebP, AVIF, GIF or SVG.");
  if (f.size > MAX_IMAGE_BYTES) throw new UploadError("Images must be 5 MB or smaller.");
  const m = await db.media.create({ data: { filename: f.name.slice(0, 200), mime: f.type, size: f.size, data: Buffer.from(await f.arrayBuffer()) } });
  return m.id;
}

export async function deleteImage(id?: string | null) {
  if (id) await db.media.delete({ where: { id } }).catch(() => {});
}

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
/** Stores an uploaded PDF; returns its id. */
export async function storePdf(f: FormDataEntryValue | null): Promise<string> {
  if (!f || typeof f === "string" || f.size === 0) throw new UploadError("Please choose a PDF file.");
  if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) throw new UploadError("Reports must be PDF files.");
  if (f.size > MAX_PDF_BYTES) throw new UploadError("The PDF is larger than 20 MB. Please compress it and try again.");
  const m = await db.media.create({ data: { filename: f.name.slice(0, 200), mime: "application/pdf", size: f.size, data: Buffer.from(await f.arrayBuffer()) } });
  return m.id;
}
