"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import * as db from "@/lib/db";
import { removeThumbnail, saveThumbnail } from "@/lib/uploads";
import { isValidHttpUrl, slugify } from "@/lib/utils";
import type { AdSlotPosition } from "@/types/database";

export interface ActionResult {
  ok: boolean;
  error?: string;
  slug?: string;
}

/** Every action re-verifies the caller server-side — never trust the UI. */
async function requireAdmin() {
  const cookieStore = await cookies();
  const valid = await verifySessionToken(
    cookieStore.get(SESSION_COOKIE)?.value
  );
  if (!valid) throw new Error("Unauthorized");
}

function parsePageForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const destinationUrl = String(formData.get("destination_url") ?? "").trim();
  const countdown = Number(formData.get("countdown_seconds") ?? 60);
  const autoRedirect = formData.get("auto_redirect") === "on";
  const enabled = formData.get("enabled") === "on";

  if (!title) throw new Error("Title is required.");
  const slug = slugify(rawSlug || title);
  if (!slug) throw new Error("Slug is required.");
  if (!isValidHttpUrl(destinationUrl)) {
    throw new Error(
      "Destination must be a full link starting with https:// (or http://)."
    );
  }
  if (!Number.isFinite(countdown) || countdown < 0 || countdown > 3600) {
    throw new Error("Countdown must be between 0 and 3600 seconds.");
  }

  return {
    title: title.slice(0, 120),
    slug: slug.slice(0, 100),
    description: description.slice(0, 300),
    destination_url: destinationUrl,
    countdown_seconds: Math.round(countdown),
    auto_redirect: autoRedirect,
    enabled,
  };
}

function revalidateAll(slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/pages");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/go/${slug}`);
}

export async function createPageAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const fields = parsePageForm(formData);

    const thumb = formData.get("thumbnail");
    let thumbnail_url: string | null = null;
    if (thumb instanceof File && thumb.size > 0) {
      thumbnail_url = await saveThumbnail(thumb, fields.slug);
    }

    db.createPage({ ...fields, thumbnail_url });
    revalidateAll(fields.slug);
    return { ok: true, slug: fields.slug };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function updatePageAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const fields = parsePageForm(formData);

    const existing = db.getPageById(id);
    if (!existing) return { ok: false, error: "Page not found." };

    const thumb = formData.get("thumbnail");
    let thumbnail_url = existing.thumbnail_url;
    if (formData.get("remove_thumbnail") === "on") {
      await removeThumbnail(thumbnail_url);
      thumbnail_url = null;
    }
    if (thumb instanceof File && thumb.size > 0) {
      await removeThumbnail(thumbnail_url);
      thumbnail_url = await saveThumbnail(thumb, fields.slug);
    }

    db.updatePage(id, { ...fields, thumbnail_url });

    revalidateAll(fields.slug);
    if (existing.slug !== fields.slug) revalidatePath(`/go/${existing.slug}`);
    return { ok: true, slug: fields.slug };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function deletePageAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const page = db.deletePage(id);
    if (!page) return { ok: false, error: "Page not found." };
    await removeThumbnail(page.thumbnail_url);
    revalidateAll(page.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function duplicatePageAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const copy = db.duplicatePage(id);
    if (!copy) return { ok: false, error: "Page not found." };
    revalidateAll(copy.slug);
    return { ok: true, slug: copy.slug };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function togglePageAction(
  id: string,
  enabled: boolean
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const page = db.setPageEnabled(id, enabled);
    if (!page) return { ok: false, error: "Page not found." };
    revalidateAll(page.slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

const AD_POSITIONS: AdSlotPosition[] = [
  "top",
  "middle",
  "bottom",
  "sticky",
  "sidebar",
];

export async function updateAdSlotAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const position = String(formData.get("position") ?? "") as AdSlotPosition;
    if (!AD_POSITIONS.includes(position)) {
      return { ok: false, error: "Unknown ad placement." };
    }

    const minHeight = Number(formData.get("min_height") ?? 90);
    if (!Number.isFinite(minHeight) || minHeight < 0 || minHeight > 1000) {
      return { ok: false, error: "Min height must be between 0 and 1000 px." };
    }

    db.updateAdSlot(position, {
      enabled: formData.get("enabled") === "on",
      label: String(formData.get("label") ?? "Advertisement").slice(0, 60),
      code: String(formData.get("code") ?? "").slice(0, 20_000),
      min_height: Math.round(minHeight),
    });

    // Ad slots render on every landing page.
    revalidatePath("/admin/ads");
    revalidatePath("/go/[slug]", "page");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}
