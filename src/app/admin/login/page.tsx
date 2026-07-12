"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn, User } from "lucide-react";
import { loginAction } from "@/app/admin/auth-actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (!result.ok) {
      setError(result.error ?? "Sign in failed.");
      setLoading(false);
      return;
    }

    // Middleware re-verifies the session cookie server-side.
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold tracking-tight">
          Admin sign in
        </h1>
        <p className="mt-1 text-center text-sm text-muted">
          UnlockHub dashboard access
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-4 rounded-2xl border border-border-soft bg-surface p-6"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Username</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                name="username"
                required
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-border-soft bg-surface-2 py-2.5 pl-10 pr-4 outline-none transition focus:border-primary"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Password</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-border-soft bg-surface-2 px-4 py-2.5 outline-none transition focus:border-primary"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
