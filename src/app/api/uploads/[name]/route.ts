import { NextRequest, NextResponse } from "next/server";
import { getThumbnailBlob } from "@/lib/db";

/** Serves thumbnails stored in the database. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  if (!/^[a-z0-9-]+\.(jpg|png|webp|gif)$/i.test(name)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const thumb = await getThumbnailBlob(name);
  if (!thumb) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Blob([thumb.data as BlobPart]), {
    headers: {
      "Content-Type": thumb.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
