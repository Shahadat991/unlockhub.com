import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { listPagesWithStats } from "@/lib/db";
import { PagesTable } from "@/components/admin/PagesTable";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const pages = listPagesWithStats();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Landing pages</h1>
          <p className="mt-1 text-sm text-muted">
            {pages.length} page{pages.length === 1 ? "" : "s"} total
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          <PlusCircle className="h-4 w-4" />
          New page
        </Link>
      </div>

      <PagesTable pages={pages} />
    </div>
  );
}
