import { PageForm } from "@/components/admin/PageForm";

export default function NewPagePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New landing page</h1>
        <p className="mt-1 text-sm text-muted">
          Fill in the details — the page goes live instantly at /go/your-slug.
        </p>
      </div>
      <PageForm />
    </div>
  );
}
