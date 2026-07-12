import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/db";
import { CONTENT_TYPE_BY_EXT } from "@/lib/uploads";

/** Serves thumbnails saved in data/uploads. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  // Path traversal guard: only plain filenames we generated.
  if (!/^[a-z0-9-]+\.(jpg|png|webp|gif)$/i.test(name)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = name.split(".").pop()!.toLowerCase();
  try {
    const data = await readFile(path.join(UPLOADS_DIR, name));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
