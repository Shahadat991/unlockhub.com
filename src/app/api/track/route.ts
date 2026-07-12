import { NextRequest, NextResponse } from "next/server";
import { getPageBySlug, recordEvent, recordVisit } from "@/lib/db";
import {
  classifyReferrer,
  countryName,
  parseBrowser,
  parseDevice,
  visitorHash,
} from "@/lib/analytics";

/**
 * POST /api/track
 * Body: { slug: string, type: "visit" | "countdown_complete", referrer?: string }
 * (button_click is recorded server-side by /api/redirect/[slug].)
 *
 * Public endpoint used by landing pages. Rate limited in middleware.
 */
export async function POST(request: NextRequest) {
  let body: { slug?: string; type?: string; referrer?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.slice(0, 200) : "";
  const type = body.type;
  const referrer =
    typeof body.referrer === "string" ? body.referrer.slice(0, 500) : "";

  if (!slug || !type || !["visit", "countdown_complete"].includes(type)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const page = getPageBySlug(slug, { onlyEnabled: true });
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ua = request.headers.get("user-agent") ?? "";
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0";
  const hash = await visitorHash(ip, ua);

  if (type === "visit") {
    recordVisit(page.id, {
      visitor_hash: hash,
      country: countryName(request.headers.get("x-vercel-ip-country")),
      device: parseDevice(ua),
      browser: parseBrowser(ua),
      referrer_source: classifyReferrer(referrer),
      referrer,
    });
  } else {
    recordEvent(page.id, hash, "countdown_complete");
  }

  return NextResponse.json({ ok: true });
}
