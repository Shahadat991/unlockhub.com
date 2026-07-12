import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-border-soft bg-surface animate-fade-in">
        <SearchX className="h-10 w-10 text-primary" />
      </div>
      <h1 className="mt-6 text-4xl font-bold tracking-tight animate-fade-in-up">
        404 — Page not found
      </h1>
      <p className="mt-3 max-w-md text-muted animate-fade-in-up delay-100">
        This link doesn&apos;t exist or has been removed. Double-check the
        link in the video description.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover animate-fade-in-up delay-200"
      >
        Back to home
      </Link>
    </main>
  );
}
