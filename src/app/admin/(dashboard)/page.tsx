import Link from "next/link";
import {
  Users,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Fingerprint,
  TimerReset,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";
import { getDashboardStats, type Breakdown } from "@/lib/db";
import { formatNumber, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <Icon className={`h-4 w-4 ${accent ?? "text-primary"}`} />
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}

function BreakdownCard({ title, items }: { title: string; items: Breakdown[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="rounded-2xl border border-border-soft bg-surface p-5">
      <h3 className="text-sm font-semibold text-muted">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted/60">No data yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{item.label}</span>
                <span className="ml-2 tabular-nums text-muted">
                  {formatNumber(item.count)}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = getDashboardStats();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Analytics across all landing pages.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total visitors" value={formatNumber(stats.totalVisits)} />
        <StatCard icon={MousePointerClick} label="Total redirects" value={formatNumber(stats.redirects)} accent="text-success" />
        <StatCard icon={CalendarDays} label="Today's visitors" value={formatNumber(stats.todayVisits)} accent="text-accent" />
        <StatCard icon={CalendarRange} label="Weekly visitors" value={formatNumber(stats.weekVisits)} accent="text-accent" />
        <StatCard icon={CalendarClock} label="Monthly visitors" value={formatNumber(stats.monthVisits)} accent="text-accent" />
        <StatCard icon={Fingerprint} label="Unique visitors" value={formatNumber(stats.uniqueVisitors)} />
        <StatCard icon={TimerReset} label="Countdowns finished" value={formatNumber(stats.completions)} accent="text-success" />
        <StatCard icon={TrendingUp} label="Redirect rate" value={formatPercent(stats.redirectRate)} accent="text-success" />
      </div>

      {/* Most visited pages */}
      <div className="rounded-2xl border border-border-soft bg-surface">
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="text-sm font-semibold text-muted">Most visited pages</h3>
          <Link href="/admin/pages" className="text-sm text-accent hover:underline">
            Manage pages →
          </Link>
        </div>
        <div className="thin-scroll overflow-x-auto p-5">
          {stats.topPages.length === 0 ? (
            <p className="text-sm text-muted/60">
              No pages yet.{" "}
              <Link href="/admin/pages/new" className="text-accent hover:underline">
                Create your first landing page
              </Link>
              .
            </p>
          ) : (
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-soft text-xs uppercase tracking-wider text-muted">
                  <th className="pb-3 pr-4 font-medium">Page</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 text-right font-medium">Visits</th>
                  <th className="pb-3 pr-4 text-right font-medium">Redirects</th>
                  <th className="pb-3 text-right font-medium">Redirect rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.topPages.map((page) => (
                  <tr key={page.id} className="border-b border-border-soft/50 last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{page.title}</p>
                      <p className="text-xs text-muted">/go/{page.slug}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          page.enabled
                            ? "bg-success/15 text-success"
                            : "bg-danger/15 text-danger"
                        }`}
                      >
                        {page.enabled ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {formatNumber(page.visit_count)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {formatNumber(page.redirect_count)}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {formatPercent(
                        page.visit_count > 0
                          ? page.redirect_count / page.visit_count
                          : 0
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BreakdownCard title="Referrers" items={stats.referrers} />
        <BreakdownCard title="Countries" items={stats.countries} />
        <BreakdownCard title="Devices" items={stats.devices} />
        <BreakdownCard title="Browsers" items={stats.browsers} />
      </div>
    </div>
  );
}
