"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Copy,
  Link2,
  Pencil,
  Trash2,
  Power,
  ImageIcon,
  ArrowUpDown,
  Eye,
  MousePointerClick,
} from "lucide-react";
import {
  deletePageAction,
  duplicatePageAction,
  togglePageAction,
} from "@/app/admin/actions";
import { useToast } from "@/components/Toaster";
import { formatDate, formatNumber } from "@/lib/utils";
import type { PageWithStats } from "@/types/database";

type SortKey = "newest" | "oldest" | "title" | "visits" | "redirects";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
  { value: "visits", label: "Most visits" },
  { value: "redirects", label: "Most redirects" },
];

export function PagesTable({ pages }: { pages: PageWithStats[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const matched = !q
      ? [...pages]
      : pages.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.slug.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
    switch (sort) {
      case "oldest":
        return matched.sort((a, b) => a.created_at.localeCompare(b.created_at));
      case "title":
        return matched.sort((a, b) => a.title.localeCompare(b.title));
      case "visits":
        return matched.sort((a, b) => b.visit_count - a.visit_count);
      case "redirects":
        return matched.sort((a, b) => b.redirect_count - a.redirect_count);
      default:
        return matched.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  }, [pages, query, sort]);

  const copyUrl = async (slug: string) => {
    const url = `${window.location.origin}/go/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("success", "Page URL copied to clipboard!");
    } catch {
      toast("error", `Could not copy. URL: ${url}`);
    }
  };

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast("success", okMsg);
        router.refresh();
      } else {
        toast("error", res.error ?? "Something went wrong.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Search pages by title, slug, or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border-soft bg-surface py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary"
          />
        </div>
        <div className="relative">
          <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort pages"
            className="w-full appearance-none rounded-xl border border-border-soft bg-surface py-3 pl-11 pr-8 text-sm outline-none transition focus:border-primary sm:w-48"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border-soft bg-surface p-10 text-center text-sm text-muted">
          {pages.length === 0 ? (
            <>
              No landing pages yet.{" "}
              <Link href="/admin/pages/new" className="text-accent hover:underline">
                Create your first one
              </Link>
              .
            </>
          ) : (
            "No pages match your search."
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((page) => (
            <li
              key={page.id}
              className={`flex flex-col gap-4 rounded-2xl border border-border-soft bg-surface p-4 transition sm:flex-row sm:items-center ${
                pending ? "opacity-60" : ""
              }`}
            >
              {/* Thumb */}
              <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:h-16 sm:w-28">
                {page.thumbnail_url ? (
                  <Image
                    src={page.thumbnail_url}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted/40" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{page.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      page.enabled
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger"
                    }`}
                  >
                    {page.enabled ? "Live" : "Disabled"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted">
                  /go/{page.slug} · {page.countdown_seconds}s countdown
                  {page.auto_redirect ? " · auto-redirect" : ""} · created{" "}
                  {formatDate(page.created_at)}
                </p>
                <p className="mt-1 flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1 tabular-nums">
                    <Eye className="h-3.5 w-3.5" />
                    {formatNumber(page.visit_count)} visits
                  </span>
                  <span className="flex items-center gap-1 tabular-nums">
                    <MousePointerClick className="h-3.5 w-3.5" />
                    {formatNumber(page.redirect_count)} redirects
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => copyUrl(page.slug)}
                  title="Copy page URL"
                  className="rounded-lg border border-border-soft p-2.5 text-muted transition hover:border-accent/60 hover:text-accent"
                >
                  <Link2 className="h-4 w-4" />
                </button>
                <Link
                  href={`/admin/pages/${page.id}/edit`}
                  title="Edit"
                  className="rounded-lg border border-border-soft p-2.5 text-muted transition hover:border-primary/60 hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  onClick={() =>
                    run(() => duplicatePageAction(page.id), "Page duplicated (starts disabled).")
                  }
                  disabled={pending}
                  title="Duplicate"
                  className="rounded-lg border border-border-soft p-2.5 text-muted transition hover:border-accent/60 hover:text-accent"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    run(
                      () => togglePageAction(page.id, !page.enabled),
                      page.enabled ? "Page disabled." : "Page is now live!"
                    )
                  }
                  disabled={pending}
                  title={page.enabled ? "Disable" : "Enable"}
                  className={`rounded-lg border border-border-soft p-2.5 transition ${
                    page.enabled
                      ? "text-success hover:border-danger/60 hover:text-danger"
                      : "text-muted hover:border-success/60 hover:text-success"
                  }`}
                >
                  <Power className="h-4 w-4" />
                </button>

                {confirmDelete === page.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setConfirmDelete(null);
                        run(() => deletePageAction(page.id), "Page deleted.");
                      }}
                      disabled={pending}
                      className="rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white"
                    >
                      Delete?
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-lg border border-border-soft px-3 py-2 text-xs text-muted"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(page.id)}
                    title="Delete"
                    className="rounded-lg border border-border-soft p-2.5 text-muted transition hover:border-danger/60 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
