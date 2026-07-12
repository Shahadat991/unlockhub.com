"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  PanelTop,
  PanelBottom,
  PanelRight,
  GalleryVertical,
  StretchHorizontal,
} from "lucide-react";
import { updateAdSlotAction } from "@/app/admin/actions";
import { useToast } from "@/components/Toaster";
import type { AdSlotRecord } from "@/types/database";

const inputClass =
  "w-full rounded-xl border border-border-soft bg-surface-2 px-4 py-2.5 text-sm outline-none transition focus:border-primary";

const SLOT_META: Record<
  AdSlotRecord["position"],
  { title: string; hint: string; icon: React.ComponentType<{ className?: string }> }
> = {
  top: {
    title: "Top Banner",
    hint: "Above the content card, first thing visitors see.",
    icon: PanelTop,
  },
  middle: {
    title: "Middle Banner",
    hint: "Inside the card, between the countdown and the Continue button.",
    icon: GalleryVertical,
  },
  bottom: {
    title: "Bottom Banner",
    hint: "Below the content card, above the footer.",
    icon: PanelBottom,
  },
  sticky: {
    title: "Sticky Footer Banner",
    hint: "Pinned to the bottom of the screen while the page is open.",
    icon: StretchHorizontal,
  },
  sidebar: {
    title: "Sidebar Ad (desktop)",
    hint: "A 300px-wide column beside the card — only shows on desktop screens.",
    icon: PanelRight,
  },
};

function SlotCard({ slot }: { slot: AdSlotRecord }) {
  const meta = SLOT_META[slot.position];
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(slot.enabled);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateAdSlotAction(formData);
      if (res.ok) {
        toast("success", `${meta.title} saved.`);
        router.refresh();
      } else {
        toast("error", res.error ?? "Something went wrong.");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border-soft bg-surface p-6"
    >
      <input type="hidden" name="position" value={slot.position} />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <meta.icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{meta.title}</p>
            <p className="text-xs text-muted">{meta.hint}</p>
          </div>
        </div>

        <label className="flex shrink-0 items-center gap-2 text-sm">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              enabled ? "bg-success/15 text-success" : "bg-surface-2 text-muted"
            }`}
          >
            {enabled ? "On" : "Off"}
          </span>
          <input
            type="checkbox"
            name="enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-5 w-5 accent-[var(--primary)]"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Label</span>
          <input
            name="label"
            maxLength={60}
            defaultValue={slot.label}
            placeholder="Advertisement"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Reserved height (px)</span>
          <input
            name="min_height"
            type="number"
            min={0}
            max={1000}
            defaultValue={slot.min_height}
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Ad tag / HTML code</span>
        <textarea
          name="code"
          rows={4}
          defaultValue={slot.code}
          placeholder='<script src="https://your-ad-network.com/tag.js" data-zone="123456" async></script>'
          className={`${inputClass} resize-y font-mono text-xs`}
        />
        <span className="text-xs text-muted">
          Paste the snippet your ad network gives you. Leave empty to show a
          placeholder box while the placement is on.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save placement
      </button>
    </form>
  );
}

export function AdSlotsManager({ slots }: { slots: AdSlotRecord[] }) {
  return (
    <div className="flex flex-col gap-5">
      {slots.map((slot) => (
        <SlotCard key={slot.position} slot={slot} />
      ))}
    </div>
  );
}
