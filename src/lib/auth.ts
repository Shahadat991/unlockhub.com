/**
 * Session auth for the admin panel.
 *
 * Uses only Web Crypto so the same code runs in the edge middleware
 * and in Node server actions. The session is an HMAC-SHA256-signed
 * expiry timestamp stored in an httpOnly cookie — no database rows,
 * no third-party service.
 *
 * Credentials come from env vars (ADMIN_USERNAME / ADMIN_PASSWORD)
 * with the defaults requested for this site.
 */

export const SESSION_COOKIE = "uh_session";
export const SESSION_DURATION_MS = 7 * 24 * 3600_000; // 7 days

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME ?? "shahadat",
    password: process.env.ADMIN_PASSWORD ?? "yourbirthday",
  };
}

function getSecret(): string {
  const { username, password } = getAdminCredentials();
  // AUTH_SECRET is optional — without it the secret is derived from the
  // credentials, so changing the password invalidates old sessions.
  return process.env.AUTH_SECRET ?? `unlockhub.v1.${username}.${password}`;
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison (Web Crypto has no timingSafeEqual). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function verifyCredentials(username: string, password: string): boolean {
  const admin = getAdminCredentials();
  // & (not &&) so both comparisons always run.
  return (
    Boolean(Number(safeEqual(username, admin.username)) &
      Number(safeEqual(password, admin.password)))
  );
}

export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_DURATION_MS;
  const sig = await hmac(`admin.${expires}`);
  return `${expires}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const expires = Number(token.slice(0, dot));
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  const expected = await hmac(`admin.${expires}`);
  return safeEqual(token.slice(dot + 1), expected);
}
