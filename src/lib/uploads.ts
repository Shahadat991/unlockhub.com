import "server-only";

import { mkdirSync } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/db";

export const MAX_THUMB_BYTES = 4 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Save an uploaded thumbnail into data/uploads and return the public
 * URL (/api/uploads/<file>) that serves it.
 */
export async function saveThumbnail(file: File, slug: string): Promise<string> {
  if (file.size > MAX_THUMB_BYTES) {
    throw new Error("Thumbnail must be 4 MB or smaller.");
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    throw new Error("Thumbnail must be a JPG, PNG, WebP, or GIF image.");
  }

  mkdirSync(UPLOADS_DIR, { recursive: true });
  const safeSlug = slug.replace(/[^a-z0-9-]/g, "").slice(0, 60) || "page";
  const name = `${safeSlug}-${Date.now()}.${ext}`;
  await writeFile(
    path.join(UPLOADS_DIR, name),
    Buffer.from(await file.arrayBuffer())
  );
  return `/api/uploads/${name}`;
}

/** Best-effort removal of a previously saved thumbnail. */
export async function removeThumbnail(url: string | null): Promise<void> {
  if (!url?.startsWith("/api/uploads/")) return;
  const name = path.basename(url);
  try {
    await unlink(path.join(UPLOADS_DIR, name));
  } catch {
    // already gone — fine
  }
}
