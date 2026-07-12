"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Save, UploadCloud } from "lucide-react";
import {
  createPageAction,
  updatePageAction,
  type ActionResult,
} from "@/app/admin/actions";
import { useToast } from "@/components/Toaster";
import { slugify } from "@/lib/utils";
import type { LandingPage } from "@/types/database";

const inputClass =
  "w-full rounded-xl border border-border-soft bg-surface-2 px-4 py-2.5 text-sm outline-none transition focus:border-primary";

export function PageForm({ page }: { page?: LandingPage }) {
  const isEdit = Boolean(page);
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [preview, setPreview] = useState<string | null>(
    page?.thumbnail_url ?? null
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFile = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast("error", "Thumbnail must be 4 MB or smaller.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result: ActionResult = isEdit
        ? await updatePageAction(page!.id, formData)
        : await createPageAction(formData);

      if (result.ok) {
        toast("success", isEdit ? "Page updated!" : "Page created!");
        router.push("/admin/pages");
        router.refresh();
      } else {
        toast("error", result.error ?? "Something went wrong.");
      }
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Left column — content */}
        <div className="flex flex-col gap-5 rounded-2xl border border-border-soft bg-surface p-6">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Page name *</span>
            <input
              name="title"
              required
              maxLength={120}
              placeholder="CapCut Pro Unlocked"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">URL slug *</span>
            <div className="flex items-center gap-0 overflow-hidden rounded-xl border border-border-soft bg-surface-2 transition focus-within:border-primary">
              <span className="shrink-0 border-r border-border-soft px-3 py-2.5 text-muted">
                /go/
              </span>
              <input
                name="slug"
                required
                maxLength={100}
                placeholder="capcut"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value) || e.target.value.toLowerCase());
                }}
                className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Short description</span>
            <textarea
              name="description"
              rows={3}
              maxLength={300}
              placeholder="Exclusive content from our latest video — ready in a few seconds."
              defaultValue={page?.description ?? ""}
              className={`${inputClass} resize-none`}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Destination URL *</span>
            <input
              name="destination_url"
              type="url"
              required
              placeholder="https://t.me/yourchannel/123"
              defaultValue={page?.destination_url ?? ""}
              className={inputClass}
            />
            <span className="text-xs text-muted">
              Where the Continue button sends visitors — any link (Telegram
              channel/post/video, or any other site). Never shown to visitors
              before they click.
            </span>
          </label>
        </div>

        {/* Right column — settings */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-border-soft bg-surface p-6">
            <p className="text-sm font-medium">Thumbnail / banner</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative mt-3 flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border-soft bg-surface-2 transition hover:border-primary/60"
            >
              {preview ? (
                <Image
                  src={preview}
                  alt="Thumbnail preview"
                  fill
                  sizes="400px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="flex flex-col items-center gap-2 text-muted">
                  <UploadCloud className="h-7 w-7" />
                  <span className="text-xs">Click to upload (max 4 MB)</span>
                </span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              name="thumbnail"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFile}
              className="hidden"
            />
            {isEdit && page?.thumbnail_url && (
              <label className="mt-3 flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" name="remove_thumbnail" className="accent-[var(--danger)]" />
                Remove current thumbnail
              </label>
            )}
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-border-soft bg-surface p-6">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Countdown (seconds)</span>
              <input
                name="countdown_seconds"
                type="number"
                min={0}
                max={3600}
                defaultValue={page?.countdown_seconds ?? 60}
                className={inputClass}
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">Auto-redirect</span>
                <span className="block text-xs text-muted">
                  Send visitors to the destination automatically at zero
                </span>
              </span>
              <input
                type="checkbox"
                name="auto_redirect"
                defaultChecked={page?.auto_redirect ?? false}
                className="h-5 w-5 accent-[var(--primary)]"
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">Page enabled</span>
                <span className="block text-xs text-muted">
                  Disabled pages return a 404
                </span>
              </span>
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={page?.enabled ?? true}
                className="h-5 w-5 accent-[var(--primary)]"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? "Save changes" : "Create page"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-border-soft px-5 py-3 text-sm text-muted transition hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
