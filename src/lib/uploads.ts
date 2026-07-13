import "server-only";

import {
  deleteThumbnailBlob,
  saveThumbnailBlob,
} from "@/lib/db";

/**
 * Thumbnails live in the database as blobs (not on disk), so the app
 * works on serverless hosts like Vercel where the filesystem is
 * read-only and wiped between deploys.
 */

export const MAX_THUMB_BYTES = 2 * 1024 * 1024; // keep DB rows lean

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
 * Store an uploaded thumbnail and return the public URL
 * (/api/uploads/<name>) that serves it.
 */
export async function saveThumbnail(file: File, slug: string): Promise<string> {
  if (file.size > MAX_THUMB_BYTES) {
    throw new Error("Thumbnail must be 2 MB or smaller.");
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    throw new Error("Thumbnail must be a JPG, PNG, WebP, or GIF image.");
  }

  const safeSlug = slug.replace(/[^a-z0-9-]/g, "").slice(0, 60) || "page";
  const name = `${safeSlug}-${Date.now()}.${ext}`;
  await saveThumbnailBlob(
    name,
    file.type,
    new Uint8Array(await file.arrayBuffer())
  );
  return `/api/uploads/${name}`;
}

/** Best-effort removal of a previously saved thumbnail. */
export async function removeThumbnail(url: string | null): Promise<void> {
  if (!url?.startsWith("/api/uploads/")) return;
  const name = url.slice("/api/uploads/".length);
  try {
    await deleteThumbnailBlob(name);
  } catch {
    // already gone — fine
  }
}
