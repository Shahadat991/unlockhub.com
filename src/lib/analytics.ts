import "server-only";

/** Classify a raw referrer URL into a friendly source name. */
export function classifyReferrer(referrer: string): string {
  if (!referrer) return "Direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.includes("youtube.") || host === "youtu.be") return "YouTube";
    if (host.includes("google.")) return "Google";
    if (host === "t.me" || host.includes("telegram.")) return "Telegram";
    if (host.includes("facebook.") || host === "fb.com") return "Facebook";
    if (host.includes("instagram.")) return "Instagram";
    if (host.includes("tiktok.")) return "TikTok";
    if (host === "x.com" || host.includes("twitter.")) return "X / Twitter";
    if (host.includes("reddit.")) return "Reddit";
    if (host.includes("discord.")) return "Discord";
    if (host.includes("bing.")) return "Bing";
    if (host.includes("duckduckgo.")) return "DuckDuckGo";
    return host || "Other";
  } catch {
    return "Other";
  }
}

/** Very small user-agent parser — device class. */
export function parseDevice(ua: string): string {
  if (!ua) return "Unknown";
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "Tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua))
    return "Mobile";
  if (/android/i.test(ua)) return "Tablet";
  if (/bot|crawler|spider|crawling/i.test(ua)) return "Bot";
  return "Desktop";
}

/** Very small user-agent parser — browser family. */
export function parseBrowser(ua: string): string {
  if (!ua) return "Unknown";
  if (/edg\//i.test(ua)) return "Edge";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/chrome\/|crios\//i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua)) return "Safari";
  if (/bot|crawler|spider/i.test(ua)) return "Bot";
  return "Other";
}

/**
 * Privacy-friendly visitor fingerprint: SHA-256 of
 * ip + user-agent + salt + current UTC date. The raw IP is never
 * stored, and the hash rotates daily.
 */
export async function visitorHash(ip: string, ua: string): Promise<string> {
  const salt = process.env.ANALYTICS_SALT ?? "unlockhub-default-salt";
  const day = new Date().toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${ip}|${ua}|${salt}|${day}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/** Country name from ISO code (Vercel provides the code in a header). */
export function countryName(code: string | null): string {
  if (!code) return "Unknown";
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}
