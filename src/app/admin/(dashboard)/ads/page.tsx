import { getAdSlots } from "@/lib/db";
import { AdSlotsManager } from "@/components/admin/AdSlotsManager";

export const dynamic = "force-dynamic";

export default async function AdminAdsPage() {
  const slots = await getAdSlots();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ad placements</h1>
        <p className="mt-1 text-sm text-muted">
          Five fixed placements render on every landing page. Toggle each one
          on or off and paste the ad tag from your network (AdSense, Monetag,
          Adsterra, …) — no code changes needed. An enabled placement without
          a tag shows a placeholder box.
        </p>
      </div>

      <AdSlotsManager slots={slots} />
    </div>
  );
}
