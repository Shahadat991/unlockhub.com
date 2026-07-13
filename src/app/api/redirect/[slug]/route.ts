import { NextRequest, NextResponse } from "next/server";
import { getPageBySlug, recordEvent } from "@/lib/db";
import { visitorHash } from "@/lib/analytics";

/**
 * GET /api/redirect/[slug]
 *
 * The Continue button sends visitors here; we log the redirect and
 * 302 to the page's destination. The destination URL never appears
 * in the landing page markup, so it stays hidden until this hop.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const page = await getPageBySlug(slug, { onlyEnabled: true });
  if (!page) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const ua = request.headers.get("user-agent") ?? "";
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0";
  await recordEvent(page.id, await visitorHash(ip, ua), "button_click");

  return NextResponse.redirect(page.destination_url, 302);
}
