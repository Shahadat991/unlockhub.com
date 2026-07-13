import "server-only";

import { createClient, type Client, type Row } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  AdSlotRecord,
  AdSlotPosition,
  LandingPage,
  PageWithStats,
  TrackedEventType,
} from "@/types/database";

/**
 * Data layer on libSQL/Turso.
 *
 * - Production (Vercel): set TURSO_DATABASE_URL (libsql://...) and
 *   TURSO_AUTH_TOKEN — the client talks to Turso over HTTPS, so it
 *   works on serverless hosts with no disk.
 * - Local dev: with no env vars it falls back to a plain local file
 *   (data/unlockhub.db), same as before.
 *
 * Everything is async; the schema is created lazily once per process.
 */

const AD_POSITIONS: AdSlotPosition[] = [
  "top",
  "middle",
  "bottom",
  "sticky",
  "sidebar",
];

const AD_DEFAULTS: Record<
  AdSlotPosition,
  { label: string; min_height: number }
> = {
  top: { label: "Top Banner", min_height: 90 },
  middle: { label: "Middle Banner", min_height: 250 },
  bottom: { label: "Bottom Banner", min_height: 90 },
  sticky: { label: "Sticky Footer Banner", min_height: 60 },
  sidebar: { label: "Sidebar Ad", min_height: 600 },
};

function createDbClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  // Local file fallback for development.
  const dataDir = path.join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });
  return createClient({
    url: `file:${path.join(dataDir, "unlockhub.db").replace(/\\/g, "/")}`,
  });
}

async function initSchema(db: Client): Promise<void> {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        thumbnail_url TEXT,
        destination_url TEXT NOT NULL,
        countdown_seconds INTEGER NOT NULL DEFAULT 60,
        auto_redirect INTEGER NOT NULL DEFAULT 0,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
        visitor_hash TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'Unknown',
        device TEXT NOT NULL DEFAULT 'Unknown',
        browser TEXT NOT NULL DEFAULT 'Unknown',
        referrer_source TEXT NOT NULL DEFAULT 'Direct',
        referrer TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_visits_page ON visits(page_id)`,
      `CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at)`,
      `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
        visitor_hash TEXT NOT NULL,
        event_type TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_events_page ON events(page_id)`,
      `CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)`,
      `CREATE TABLE IF NOT EXISTS ad_slots (
        position TEXT PRIMARY KEY,
        enabled INTEGER NOT NULL DEFAULT 0,
        label TEXT NOT NULL DEFAULT 'Advertisement',
        code TEXT NOT NULL DEFAULT '',
        min_height INTEGER NOT NULL DEFAULT 90
      )`,
      `CREATE TABLE IF NOT EXISTS thumbnails (
        name TEXT PRIMARY KEY,
        content_type TEXT NOT NULL,
        data BLOB NOT NULL,
        created_at TEXT NOT NULL
      )`,
    ],
    "write"
  );

  // Migrate databases created before the destination_url rename.
  const cols = await db.execute(
    "SELECT name FROM pragma_table_info('pages')"
  );
  if (cols.rows.some((c) => c.name === "telegram_url")) {
    await db.execute(
      "ALTER TABLE pages RENAME COLUMN telegram_url TO destination_url"
    );
  }

  // Seed the fixed ad placements if missing.
  await db.batch(
    AD_POSITIONS.map((pos) => ({
      sql: `INSERT OR IGNORE INTO ad_slots (position, enabled, label, code, min_height)
            VALUES (?, 0, ?, '', ?)`,
      args: [pos, AD_DEFAULTS[pos].label, AD_DEFAULTS[pos].min_height],
    })),
    "write"
  );
}

// One client + one schema-init per process (survives dev HMR).
const globalForDb = globalThis as unknown as {
  __unlockhubClient?: Client;
  __unlockhubSchema?: Promise<void>;
};

export async function getDb(): Promise<Client> {
  if (!globalForDb.__unlockhubClient) {
    globalForDb.__unlockhubClient = createDbClient();
  }
  if (!globalForDb.__unlockhubSchema) {
    globalForDb.__unlockhubSchema = initSchema(globalForDb.__unlockhubClient);
  }
  await globalForDb.__unlockhubSchema;
  return globalForDb.__unlockhubClient;
}

function now(): string {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

function rowToPage(row: Row): LandingPage {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description ?? ""),
    thumbnail_url: (row.thumbnail_url as string | null) ?? null,
    destination_url: String(row.destination_url),
    countdown_seconds: Number(row.countdown_seconds),
    auto_redirect: Boolean(Number(row.auto_redirect)),
    enabled: Boolean(Number(row.enabled)),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export interface PageFields {
  slug: string;
  title: string;
  description: string;
  destination_url: string;
  countdown_seconds: number;
  auto_redirect: boolean;
  enabled: boolean;
  thumbnail_url?: string | null;
}

export class SlugTakenError extends Error {
  constructor(slug: string) {
    super(`Slug "${slug}" is already in use.`);
  }
}

export async function listPages(): Promise<LandingPage[]> {
  const db = await getDb();
  const res = await db.execute("SELECT * FROM pages ORDER BY created_at DESC");
  return res.rows.map(rowToPage);
}

export async function listPagesWithStats(): Promise<PageWithStats[]> {
  const db = await getDb();
  const res = await db.execute(
    `SELECT p.*,
      (SELECT COUNT(*) FROM visits v WHERE v.page_id = p.id) AS visit_count,
      (SELECT COUNT(*) FROM events e
        WHERE e.page_id = p.id AND e.event_type = 'button_click') AS redirect_count
     FROM pages p ORDER BY p.created_at DESC`
  );
  return res.rows.map((row) => ({
    ...rowToPage(row),
    visit_count: Number(row.visit_count),
    redirect_count: Number(row.redirect_count),
  }));
}

export async function getPageBySlug(
  slug: string,
  opts: { onlyEnabled?: boolean } = {}
): Promise<LandingPage | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: opts.onlyEnabled
      ? "SELECT * FROM pages WHERE slug = ? AND enabled = 1"
      : "SELECT * FROM pages WHERE slug = ?",
    args: [slug],
  });
  return res.rows[0] ? rowToPage(res.rows[0]) : null;
}

export async function getPageById(id: string): Promise<LandingPage | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM pages WHERE id = ?",
    args: [id],
  });
  return res.rows[0] ? rowToPage(res.rows[0]) : null;
}

async function assertSlugFree(slug: string, excludeId?: string): Promise<void> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT id FROM pages WHERE slug = ?",
    args: [slug],
  });
  const clash = res.rows[0];
  if (clash && String(clash.id) !== excludeId) throw new SlugTakenError(slug);
}

export async function createPage(fields: PageFields): Promise<LandingPage> {
  await assertSlugFree(fields.slug);
  const db = await getDb();
  const id = randomUUID();
  const ts = now();
  await db.execute({
    sql: `INSERT INTO pages
      (id, slug, title, description, thumbnail_url, destination_url,
       countdown_seconds, auto_redirect, enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      fields.slug,
      fields.title,
      fields.description,
      fields.thumbnail_url ?? null,
      fields.destination_url,
      fields.countdown_seconds,
      fields.auto_redirect ? 1 : 0,
      fields.enabled ? 1 : 0,
      ts,
      ts,
    ],
  });
  return (await getPageById(id))!;
}

export async function updatePage(
  id: string,
  fields: PageFields & { thumbnail_url: string | null }
): Promise<LandingPage | null> {
  const existing = await getPageById(id);
  if (!existing) return null;
  await assertSlugFree(fields.slug, id);
  const db = await getDb();
  await db.execute({
    sql: `UPDATE pages SET slug = ?, title = ?, description = ?, thumbnail_url = ?,
      destination_url = ?, countdown_seconds = ?, auto_redirect = ?, enabled = ?,
      updated_at = ? WHERE id = ?`,
    args: [
      fields.slug,
      fields.title,
      fields.description,
      fields.thumbnail_url,
      fields.destination_url,
      fields.countdown_seconds,
      fields.auto_redirect ? 1 : 0,
      fields.enabled ? 1 : 0,
      now(),
      id,
    ],
  });
  return getPageById(id);
}

export async function deletePage(id: string): Promise<LandingPage | null> {
  const page = await getPageById(id);
  if (!page) return null;
  const db = await getDb();
  // Serverless-friendly cascade (FK pragma may be off per-connection).
  await db.batch(
    [
      { sql: "DELETE FROM visits WHERE page_id = ?", args: [id] },
      { sql: "DELETE FROM events WHERE page_id = ?", args: [id] },
      { sql: "DELETE FROM pages WHERE id = ?", args: [id] },
    ],
    "write"
  );
  return page;
}

export async function duplicatePage(id: string): Promise<LandingPage | null> {
  const page = await getPageById(id);
  if (!page) return null;

  let newSlug = `${page.slug}-copy`;
  for (let i = 2; i <= 100; i++) {
    try {
      await assertSlugFree(newSlug);
      break;
    } catch {
      newSlug = `${page.slug}-copy-${i}`;
    }
  }

  return createPage({
    slug: newSlug,
    title: `${page.title} (Copy)`,
    description: page.description,
    destination_url: page.destination_url,
    countdown_seconds: page.countdown_seconds,
    auto_redirect: page.auto_redirect,
    enabled: false, // duplicates start disabled so you can edit first
    thumbnail_url: page.thumbnail_url,
  });
}

export async function setPageEnabled(
  id: string,
  enabled: boolean
): Promise<LandingPage | null> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE pages SET enabled = ?, updated_at = ? WHERE id = ?",
    args: [enabled ? 1 : 0, now(), id],
  });
  return getPageById(id);
}

/* ------------------------------------------------------------------ */
/* Tracking                                                            */
/* ------------------------------------------------------------------ */

export async function recordVisit(
  pageId: string,
  data: {
    visitor_hash: string;
    country: string;
    device: string;
    browser: string;
    referrer_source: string;
    referrer: string;
  }
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO visits
      (page_id, visitor_hash, country, device, browser, referrer_source, referrer, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      pageId,
      data.visitor_hash,
      data.country,
      data.device,
      data.browser,
      data.referrer_source,
      data.referrer,
      now(),
    ],
  });
}

export async function recordEvent(
  pageId: string,
  visitorHash: string,
  type: TrackedEventType
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO events (page_id, visitor_hash, event_type, created_at) VALUES (?, ?, ?, ?)",
    args: [pageId, visitorHash, type, now()],
  });
}

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */

export interface Breakdown {
  label: string;
  count: number;
}

export interface DashboardStats {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  weekVisits: number;
  monthVisits: number;
  completions: number;
  redirects: number;
  redirectRate: number;
  referrers: Breakdown[];
  countries: Breakdown[];
  devices: Breakdown[];
  browsers: Breakdown[];
  topPages: PageWithStats[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDb();

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600_000);

  const one = async (sql: string, args: (string | number)[] = []) =>
    Number((await db.execute({ sql, args })).rows[0]?.c ?? 0);

  const breakdown = async (column: string): Promise<Breakdown[]> => {
    const res = await db.execute(
      `SELECT ${column} AS label, COUNT(*) AS count FROM visits
       GROUP BY ${column} ORDER BY count DESC LIMIT 8`
    );
    return res.rows.map((r) => ({
      label: String(r.label),
      count: Number(r.count),
    }));
  };

  const [
    totalVisits,
    uniqueVisitors,
    todayVisits,
    weekVisits,
    monthVisits,
    completions,
    redirects,
    referrers,
    countries,
    devices,
    browsers,
    pages,
  ] = await Promise.all([
    one("SELECT COUNT(*) AS c FROM visits"),
    one("SELECT COUNT(DISTINCT visitor_hash) AS c FROM visits"),
    one("SELECT COUNT(*) AS c FROM visits WHERE created_at >= ?", [
      dayStart.toISOString(),
    ]),
    one("SELECT COUNT(*) AS c FROM visits WHERE created_at >= ?", [
      weekAgo.toISOString(),
    ]),
    one("SELECT COUNT(*) AS c FROM visits WHERE created_at >= ?", [
      monthAgo.toISOString(),
    ]),
    one("SELECT COUNT(*) AS c FROM events WHERE event_type = 'countdown_complete'"),
    one("SELECT COUNT(*) AS c FROM events WHERE event_type = 'button_click'"),
    breakdown("referrer_source"),
    breakdown("country"),
    breakdown("device"),
    breakdown("browser"),
    listPagesWithStats(),
  ]);

  return {
    totalVisits,
    uniqueVisitors,
    todayVisits,
    weekVisits,
    monthVisits,
    completions,
    redirects,
    redirectRate: totalVisits > 0 ? redirects / totalVisits : 0,
    referrers,
    countries,
    devices,
    browsers,
    topPages: pages
      .sort((a, b) => b.visit_count - a.visit_count)
      .slice(0, 10),
  };
}

/* ------------------------------------------------------------------ */
/* Ad slots                                                            */
/* ------------------------------------------------------------------ */

function rowToAdSlot(row: Row): AdSlotRecord {
  return {
    position: String(row.position) as AdSlotPosition,
    enabled: Boolean(Number(row.enabled)),
    label: String(row.label),
    code: String(row.code),
    min_height: Number(row.min_height),
  };
}

export async function getAdSlots(): Promise<AdSlotRecord[]> {
  const db = await getDb();
  const res = await db.execute("SELECT * FROM ad_slots");
  const bySlot = new Map(
    res.rows.map((r) => [String(r.position), rowToAdSlot(r)])
  );
  // Fixed display order.
  return AD_POSITIONS.map((pos) => bySlot.get(pos)).filter(
    (s): s is AdSlotRecord => Boolean(s)
  );
}

export async function updateAdSlot(
  position: AdSlotPosition,
  fields: { enabled: boolean; label: string; code: string; min_height: number }
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE ad_slots SET enabled = ?, label = ?, code = ?, min_height = ? WHERE position = ?",
    args: [
      fields.enabled ? 1 : 0,
      fields.label,
      fields.code,
      fields.min_height,
      position,
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Thumbnails (stored in the DB so serverless hosts work)              */
/* ------------------------------------------------------------------ */

export async function saveThumbnailBlob(
  name: string,
  contentType: string,
  data: Uint8Array
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT OR REPLACE INTO thumbnails (name, content_type, data, created_at) VALUES (?, ?, ?, ?)",
    args: [name, contentType, data, now()],
  });
}

export async function getThumbnailBlob(
  name: string
): Promise<{ contentType: string; data: Uint8Array } | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT content_type, data FROM thumbnails WHERE name = ?",
    args: [name],
  });
  const row = res.rows[0];
  if (!row) return null;
  const raw = row.data;
  const data =
    raw instanceof ArrayBuffer
      ? new Uint8Array(raw)
      : (raw as unknown as Uint8Array);
  return { contentType: String(row.content_type), data };
}

export async function deleteThumbnailBlob(name: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "DELETE FROM thumbnails WHERE name = ?",
    args: [name],
  });
}
