import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Middleware responsibilities:
 *  1. Protect /admin/* — only a valid signed session cookie may pass.
 *     Visitors never see a login wall anywhere else.
 *  2. Rate-limit /api/track to blunt abuse (per-IP, in-memory).
 */

// ---- simple in-memory rate limiter (per server instance) ----
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30; // per IP per minute on /api/track
const buckets = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now > bucket.reset) {
    buckets.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  if (buckets.size > 10_000) buckets.clear(); // memory guard
  return bucket.count > MAX_REQUESTS;
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---- 1. Rate limit the tracking endpoint ----
  if (pathname.startsWith("/api/track")) {
    if (rateLimited(clientIp(request))) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Same-origin check (CSRF-ish protection for the public endpoint).
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.next();
  }

  // ---- 2. Admin protection ----
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isAdmin = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value
  );

  if (pathname === "/admin/login") {
    // Already signed in? Go straight to the dashboard.
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!isAdmin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/api/track"],
};
