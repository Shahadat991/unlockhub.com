"use client";

import { useEffect, useRef } from "react";
import type { AdSlotRecord } from "@/types/database";

/**
 * Renders one ad placement configured in the admin panel.
 * Ad network tags often include <script> elements, which browsers
 * ignore when set via innerHTML — so we re-create each script node
 * to make it execute.
 */
function InjectedAd({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !code) return;

    el.innerHTML = code;
    el.querySelectorAll("script").forEach((old) => {
      const script = document.createElement("script");
      Array.from(old.attributes).forEach((attr) =>
        script.setAttribute(attr.name, attr.value)
      );
      script.text = old.text;
      old.replaceWith(script);
    });

    return () => {
      el.innerHTML = "";
    };
  }, [code]);

  return <div ref={ref} className="flex w-full justify-center overflow-hidden" />;
}

/**
 * An enabled slot with no ad code yet shows a clearly marked
 * placeholder, so you can see exactly where the ad will appear
 * before connecting a network.
 */
export function AdSlot({ slot }: { slot: AdSlotRecord | undefined }) {
  if (!slot || !slot.enabled) return null;

  const hasCode = slot.code.trim().length > 0;

  return (
    <aside
      aria-label="Advertisement"
      className="w-full"
      style={{ minHeight: slot.min_height }}
    >
      {slot.label && (
        <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-muted/60">
          {slot.label}
        </p>
      )}
      {hasCode ? (
        <InjectedAd code={slot.code} />
      ) : (
        <div
          className="flex w-full items-center justify-center rounded-xl border border-dashed border-border-soft bg-surface-2/50 text-xs text-muted/60"
          style={{ minHeight: Math.max(48, slot.min_height - 20) }}
        >
          Ad space
        </div>
      )}
    </aside>
  );
}
