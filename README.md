# UnlockHub — YouTube → Telegram redirect platform

A self-contained traffic-redirect platform for YouTube Shorts: paste a
unique link in your video description, visitors land on a countdown
page with ad placements, and when the timer finishes a **Continue**
button takes them to the Telegram channel/post/video you assigned to
that page. Everything is managed from a web admin dashboard — no code
edits needed.

Built with **Next.js 15 (App Router) + TypeScript + Tailwind v4** and a
**local SQLite database** (Node's built-in `node:sqlite` — zero external
services, no native modules).

## Quick start

```bash
npm install
npm run dev   # http://localhost:3000
```

That's it — the database (`data/unlockhub.db`) is created automatically
on first run.

## Admin panel

- Open the site and click **Admin** (top right), or go to `/admin`.
- Default credentials: username `shahadat`, password `yourbirthday`.
- **Change them before deploying publicly** — set `ADMIN_USERNAME` /
  `ADMIN_PASSWORD` in `.env.local` (see `.env.example`).

### What you can manage

- **Pages** — create / edit / duplicate / delete / search / sort
  unlimited landing pages. Each page has a name, slug, description,
  thumbnail, Telegram destination URL, countdown duration (default
  60 s), active/inactive status, and live visit + redirect counts.
  Every page gets a shareable link like `/go/anime1` with a one-click
  copy button.
- **Ads** — four fixed placements (Top Banner, Middle Banner, Bottom
  Banner, Sticky Footer Banner). Toggle each on/off and paste the ad
  tag from your network (AdSense, Monetag, Adsterra, …). An enabled
  placement without a tag shows a placeholder box.
- **Dashboard** — total / today / weekly / monthly visitors, total
  redirects, redirect rate, most-visited pages, plus referrer /
  country / device / browser breakdowns.

## Project layout (modules)

| Module | Where |
| --- | --- |
| Database (pages, analytics, ads) | `src/lib/db.ts` |
| Authentication (signed-cookie sessions) | `src/lib/auth.ts`, `src/middleware.ts`, `src/app/admin/auth-actions.ts` |
| Admin actions (pages + ads CRUD) | `src/app/admin/actions.ts` |
| Landing pages (redirects) | `src/app/go/[slug]/`, `src/components/LandingPageClient.tsx` |
| Ads rendering | `src/components/AdSlot.tsx`, `src/app/admin/(dashboard)/ads/` |
| Analytics tracking | `src/app/api/track/route.ts`, `src/lib/analytics.ts` |
| Site settings | `src/config/site.ts`, `.env.example` |

## Notes

- Visitor analytics are privacy-friendly: IPs are never stored, only a
  salted hash that rotates daily.
- The `data/` folder holds the SQLite database and uploaded
  thumbnails — back it up to keep your pages and stats. It is
  git-ignored.
- Deploying: use any Node host (VPS, Railway, Render, …) with a
  persistent disk for `data/`. Serverless hosts without persistent
  storage (e.g. Vercel) won't retain the SQLite file between deploys.
