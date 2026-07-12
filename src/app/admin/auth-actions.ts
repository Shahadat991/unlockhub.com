"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_DURATION_MS,
  verifyCredentials,
} from "@/lib/auth";

export interface LoginResult {
  ok: boolean;
  error?: string;
}

// Simple brute-force guard: after 5 failed attempts, lock for 15 minutes.
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60_000;
const failures = { count: 0, lockedUntil: 0 };

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { ok: false, error: "Username and password are required." };
  }

  if (Date.now() < failures.lockedUntil) {
    const mins = Math.ceil((failures.lockedUntil - Date.now()) / 60_000);
    return {
      ok: false,
      error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
    };
  }

  if (!verifyCredentials(username, password)) {
    failures.count += 1;
    if (failures.count >= MAX_FAILURES) {
      failures.lockedUntil = Date.now() + LOCK_MS;
      failures.count = 0;
    }
    return { ok: false, error: "Invalid username or password." };
  }

  failures.count = 0;
  failures.lockedUntil = 0;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
