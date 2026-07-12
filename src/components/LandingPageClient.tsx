"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Link2, Unlock } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { AdSlot } from "@/components/AdSlot";
import { ThemeToggle } from "@/components/ThemeToggle";
import { siteConfig } from "@/config/site";
import type { AdSlotRecord, PublicLandingPage } from "@/types/database";

function track(slug: string, type: string, referrer = "") {
  const payload = JSON.stringify({ slug, type, referrer });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/track",
        new Blob([payload], { type: "application/json" })
      );
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

export function LandingPageClient({
  page,
  adSlots,
}: {
  page: PublicLandingPage;
  adSlots: AdSlotRecord[];
}) {
  const [remaining, setRemaining] = useState(page.countdown_seconds);
  const [redirecting, setRedirecting] = useState(false);
  const completedRef = useRef(false);
  const done = remaining <= 0;

  const slot = (position: AdSlotRecord["position"]) =>
    adSlots.find((s) => s.position === position);
  const sticky = slot("sticky");
  const sidebar = slot("sidebar");

  // Track the visit once on mount (client side so we get document.referrer).
  useEffect(() => {
    track(page.slug, "visit", document.referrer);
  }, [page.slug]);

  // Countdown clock.
  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [done]);

  // The destination stays hidden — the server logs the click and 302s.
  const goToDestination = useCallback(() => {
    setRedirecting(true);
    window.location.href = `/api/redirect/${page.slug}`;
  }, [page.slug]);

  // Fire completion event (once) + optional auto redirect.
  useEffect(() => {
    if (!done || completedRef.current) return;
    completedRef.current = true;
    track(page.slug, "countdown_complete");
    if (page.auto_redirect) {
      const t = setTimeout(goToDestination, 1200);
      return () => clearTimeout(t);
    }
  }, [done, page.slug, page.auto_redirect, goToDestination]);

  const progress =
    page.countdown_seconds > 0
      ? ((page.countdown_seconds - remaining) / page.countdown_seconds) * 100
      : 100;

  return (
    <main
      className={`mx-auto flex min-h-dvh w-full flex-col gap-6 px-4 py-6 sm:py-10 ${
        sidebar ? "max-w-5xl" : "max-w-2xl"
      }`}
      style={sticky ? { paddingBottom: sticky.min_height + 48 } : undefined}
    >
      {/* Site logo + theme toggle */}
      <div className="flex w-full items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
            <Unlock className="h-4 w-4 text-primary" />
          </span>
          {siteConfig.name}
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex w-full items-start gap-6">
        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-6">
          <AdSlot slot={slot("top")} />

          <article className="w-full overflow-hidden rounded-3xl border border-border-soft bg-surface shadow-2xl shadow-black/20 animate-fade-in-up">
            {/* Thumbnail */}
            {page.thumbnail_url ? (
              <div className="relative aspect-video w-full">
                <Image
                  src={page.thumbnail_url}
                  alt={page.title}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 672px) 100vw, 672px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary/25 via-surface-2 to-accent/15">
                <Link2 className="h-16 w-16 text-primary/70" />
              </div>
            )}

            <div className="flex flex-col items-center gap-6 p-6 sm:p-10">
              {/* Title + description */}
              <header className="text-center animate-fade-in-up delay-100">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {page.title}
                </h1>
                {page.description && (
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                    {page.description}
                  </p>
                )}
              </header>

              {/* Countdown */}
              <div className="animate-fade-in-up delay-200">
                <CountdownTimer
                  total={page.countdown_seconds}
                  remaining={remaining}
                />
              </div>

              {/* Progress bar + instructions */}
              <div className="w-full max-w-md animate-fade-in-up delay-200">
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p
                  className="mt-3 text-center text-sm leading-relaxed text-muted"
                  aria-live="polite"
                >
                  {done
                    ? page.auto_redirect
                      ? "Your link is ready! Redirecting…"
                      : "Your link is ready!"
                    : `Please wait ${page.countdown_seconds} seconds while we prepare your link.`}
                </p>
              </div>

              <AdSlot slot={slot("middle")} />

              {/* Continue button — fully hidden until the countdown finishes */}
              {done ? (
                <button
                  onClick={goToDestination}
                  disabled={redirecting}
                  className="group flex w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-hover px-6 py-5 text-lg font-semibold text-white animate-fade-in-up animate-pulse-glow transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70"
                >
                  {redirecting ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Opening your link…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              ) : (
                <div className="flex w-full max-w-md items-center justify-center gap-3 rounded-2xl border border-dashed border-border-soft bg-surface-2/60 px-6 py-5 text-sm text-muted">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted/30 border-t-primary" />
                  Your link is loading… ({remaining}s)
                </div>
              )}
            </div>
          </article>

          <AdSlot slot={slot("bottom")} />
        </div>

        {/* Sidebar ad — desktop only */}
        {sidebar && (
          <aside className="hidden w-[300px] shrink-0 lg:block">
            <div className="sticky top-6">
              <AdSlot slot={sidebar} />
            </div>
          </aside>
        )}
      </div>

      {/* Sticky footer banner */}
      {sticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-surface/95 px-4 py-2 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            <AdSlot slot={sticky} />
          </div>
        </div>
      )}
    </main>
  );
}
