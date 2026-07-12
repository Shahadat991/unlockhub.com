import { notFound } from "next/navigation";
import { getPageById } from "@/lib/db";
import { PageForm } from "@/components/admin/PageForm";

export const dynamic = "force-dynamic";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = getPageById(id);
  if (!page) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit page</h1>
        <p className="mt-1 text-sm text-muted">/go/{page.slug}</p>
      </div>
      <PageForm page={page} />
    </div>
  );
}
