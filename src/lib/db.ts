import "server-only";

import { DatabaseSync } from "node:sqlite";
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
 * Local SQLite data layer (built-in node:sqlite — zero native deps).
 * The database file lives in <project>/data/unlockhub.db and is
 * created + migrated automatically on first use.
 */

const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

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

function createDb(): DatabaseSync {
  mkdirSync(UPLOADS_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, "unlockhub.db"));
  // Rollback journal instead of WAL: WAL's shared-memory index is
  // unreliable on synced folders (OneDrive/Dropbox) and across the
  // multiple connections a Next dev server can open.
  db.exec("PRAGMA journal_mode = TRUNCATE");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
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
    );

    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      visitor_hash TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'Unknown',
      device TEXT NOT NULL DEFAULT 'Unknown',
      browser TEXT NOT NULL DEFAULT 'Unknown',
      referrer_source TEXT NOT NULL DEFAULT 'Direct',
      referrer TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_visits_page ON visits(page_id);
    CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at);

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      visitor_hash TEXT NOT NULL,
      event_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_page ON events(page_id);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

    CREATE TABLE IF NOT EXISTS ad_slots (
      position TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 0,
      label TEXT NOT NULL DEFAULT 'Advertisement',
      code TEXT NOT NULL DEFAULT '',
      min_height INTEGER NOT NULL DEFAULT 90
    );
  `);

  // Migrate databases created before the destination_url rename.
  const pageCols = db
    .prepare("SELECT name FROM pragma_table_info('pages')")
    .all() as { name: string }[];
  if (pageCols.some((c) => c.name === "telegram_url")) {
    db.exec("ALTER TABLE pages RENAME COLUMN telegram_url TO destination_url");
  }

  // Seed the fixed ad placements if missing.
  const seed = db.prepare(
    `INSERT OR IGNORE INTO ad_slots (position, enabled, label, code, min_height)
     VALUES (?, 0, ?, '', ?)`
  );
  for (const pos of AD_POSITIONS) {
    seed.run(pos, AD_DEFAULTS[pos].label, AD_DEFAULTS[pos].min_height);
  }

  return db;
}

// Survive dev-server HMR: keep a single connection on globalThis.
const globalForDb = globalThis as unknown as { __unlockhubDb?: DatabaseSync };
export function getDb(): DatabaseSync {
  if (!globalForDb.__unlockhubDb) {
    globalForDb.__unlockhubDb = createDb();
  }
  return globalForDb.__unlockhubDb;
}

function now(): string {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

// node:sqlite returns null-prototype objects with numbers for booleans.
function rowToPage(row: Record<string, unknown>): LandingPage {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description ?? ""),
    thumbnail_url: (row.thumbnail_url as string | null) ?? null,
    destination_url: String(row.destination_url),
    countdown_seconds: Number(row.countdown_seconds),
    auto_redirect: Boolean(row.auto_redirect),
    enabled: Boolean(row.enabled),
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

export function listPages(): LandingPage[] {
  const rows = getDb()
    .prepare("SELECT * FROM pages ORDER BY created_at DESC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToPage);
}

export function listPagesWithStats(): PageWithStats[] {
  const rows = getDb()
    .prepare(
      `SELECT p.*,
        (SELECT COUNT(*) FROM visits v WHERE v.page_id = p.id) AS visit_count,
        (SELECT COUNT(*) FROM events e
          WHERE e.page_id = p.id AND e.event_type = 'button_click') AS redirect_count
       FROM pages p ORDER BY p.created_at DESC`
    )
    .all() as Record<string, unknown>[];
  return rows.map((row) => ({
    ...rowToPage(row),
    visit_count: Number(row.visit_count),
    redirect_count: Number(row.redirect_count),
  }));
}

export function getPageBySlug(
  slug: string,
  opts: { onlyEnabled?: boolean } = {}
): LandingPage | null {
  const row = getDb()
    .prepare(
      opts.onlyEnabled
        ? "SELECT * FROM pages WHERE slug = ? AND enabled = 1"
        : "SELECT * FROM pages WHERE slug = ?"
    )
    .get(slug) as Record<string, unknown> | undefined;
  return row ? rowToPage(row) : null;
}

export function getPageById(id: string): LandingPage | null {
  const row = getDb().prepare("SELECT * FROM pages WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToPage(row) : null;
}

function assertSlugFree(slug: string, excludeId?: string) {
  const clash = getDb()
    .prepare("SELECT id FROM pages WHERE slug = ?")
    .get(slug) as { id: string } | undefined;
  if (clash && clash.id !== excludeId) throw new SlugTakenError(slug);
}

export function createPage(fields: PageFields): LandingPage {
  assertSlugFree(fields.slug);
  const id = randomUUID();
  const ts = now();
  getDb()
    .prepare(
      `INSERT INTO pages
        (id, slug, title, description, thumbnail_url, destination_url,
         countdown_seconds, auto_redirect, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
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
      ts
    );
  return getPageById(id)!;
}

export function updatePage(
  id: string,
  fields: PageFields & { thumbnail_url: string | null }
): LandingPage | null {
  const existing = getPageById(id);
  if (!existing) return null;
  assertSlugFree(fields.slug, id);
  getDb()
    .prepare(
      `UPDATE pages SET slug = ?, title = ?, description = ?, thumbnail_url = ?,
        destination_url = ?, countdown_seconds = ?, auto_redirect = ?, enabled = ?,
        updated_at = ? WHERE id = ?`
    )
    .run(
      fields.slug,
      fields.title,
      fields.description,
      fields.thumbnail_url,
      fields.destination_url,
      fields.countdown_seconds,
      fields.auto_redirect ? 1 : 0,
      fields.enabled ? 1 : 0,
      now(),
      id
    );
  return getPageById(id);
}

export function deletePage(id: string): LandingPage | null {
  const page = getPageById(id);
  if (!page) return null;
  getDb().prepare("DELETE FROM pages WHERE id = ?").run(id);
  return page;
}

export function duplicatePage(id: string): LandingPage | null {
  const page = getPageById(id);
  if (!page) return null;

  let newSlug = `${page.slug}-copy`;
  for (let i = 2; i <= 100; i++) {
    try {
      assertSlugFree(newSlug);
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

export function setPageEnabled(id: string, enabled: boolean): LandingPage | null {
  getDb()
    .prepare("UPDATE pages SET enabled = ?, updated_at = ? WHERE id = ?")
    .run(enabled ? 1 : 0, now(), id);
  return getPageById(id);
}

/* ------------------------------------------------------------------ */
/* Tracking                                                            */
/* ------------------------------------------------------------------ */

export function recordVisit(
  pageId: string,
  data: {
    visitor_hash: string;
    country: string;
    device: string;
    browser: string;
    referrer_source: string;
    referrer: string;
  }
): void {
  getDb()
    .prepare(
      `INSERT INTO visits
        (page_id, visitor_hash, country, device, browser, referrer_source, referrer, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      pageId,
      data.visitor_hash,
      data.country,
      data.device,
      data.browser,
      data.referrer_source,
      data.referrer,
      now()
    );
}

export function recordEvent(
  pageId: string,
  visitorHash: string,
  type: TrackedEventType
): void {
  getDb()
    .prepare(
      "INSERT INTO events (page_id, visitor_hash, event_type, created_at) VALUES (?, ?, ?, ?)"
    )
    .run(pageId, visitorHash, type, now());
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

function countSince(table: "visits", since: string): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE created_at >= ?`)
    .get(since) as { c: number };
  return Number(row.c);
}

function breakdown(column: string, limit = 8): Breakdown[] {
  const rows = getDb()
    .prepare(
      `SELECT ${column} AS label, COUNT(*) AS count FROM visits
       GROUP BY ${column} ORDER BY count DESC LIMIT ?`
    )
    .all(limit) as { label: string; count: number }[];
  return rows.map((r) => ({ label: String(r.label), count: Number(r.count) }));
}

export function getDashboardStats(): DashboardStats {
  const db = getDb();

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600_000);

  const totalVisits = Number(
    (db.prepare("SELECT COUNT(*) AS c FROM visits").get() as { c: number }).c
  );
  const uniqueVisitors = Number(
    (
      db
        .prepare("SELECT COUNT(DISTINCT visitor_hash) AS c FROM visits")
        .get() as { c: number }
    ).c
  );
  const eventCount = (type: TrackedEventType) =>
    Number(
      (
        db
          .prepare("SELECT COUNT(*) AS c FROM events WHERE event_type = ?")
          .get(type) as { c: number }
      ).c
    );

  const redirects = eventCount("button_click");
  const topPages = listPagesWithStats()
    .sort((a, b) => b.visit_count - a.visit_count)
    .slice(0, 10);

  return {
    totalVisits,
    uniqueVisitors,
    todayVisits: countSince("visits", dayStart.toISOString()),
    weekVisits: countSince("visits", weekAgo.toISOString()),
    monthVisits: countSince("visits", monthAgo.toISOString()),
    completions: eventCount("countdown_complete"),
    redirects,
    redirectRate: totalVisits > 0 ? redirects / totalVisits : 0,
    referrers: breakdown("referrer_source"),
    countries: breakdown("country"),
    devices: breakdown("device"),
    browsers: breakdown("browser"),
    topPages,
  };
}

/* ------------------------------------------------------------------ */
/* Ad slots                                                            */
/* ------------------------------------------------------------------ */

function rowToAdSlot(row: Record<string, unknown>): AdSlotRecord {
  return {
    position: row.position as AdSlotPosition,
    enabled: Boolean(row.enabled),
    label: String(row.label),
    code: String(row.code),
    min_height: Number(row.min_height),
  };
}

export function getAdSlots(): AdSlotRecord[] {
  const rows = getDb().prepare("SELECT * FROM ad_slots").all() as Record<
    string,
    unknown
  >[];
  const bySlot = new Map(rows.map((r) => [String(r.position), rowToAdSlot(r)]));
  // Fixed display order.
  return AD_POSITIONS.map((pos) => bySlot.get(pos)).filter(
    (s): s is AdSlotRecord => Boolean(s)
  );
}

export function updateAdSlot(
  position: AdSlotPosition,
  fields: { enabled: boolean; label: string; code: string; min_height: number }
): void {
  getDb()
    .prepare(
      "UPDATE ad_slots SET enabled = ?, label = ?, code = ?, min_height = ? WHERE position = ?"
    )
    .run(
      fields.enabled ? 1 : 0,
      fields.label,
      fields.code,
      fields.min_height,
      position
    );
}
