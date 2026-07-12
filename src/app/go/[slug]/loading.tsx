export default function LoadingLandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center gap-6 px-4 py-6 sm:py-10">
      <div className="w-full overflow-hidden rounded-3xl border border-border-soft bg-surface">
        <div className="skeleton aspect-video w-full" />
        <div className="flex flex-col items-center gap-6 p-6 sm:p-10">
          <div className="skeleton h-8 w-2/3 rounded-lg" />
          <div className="skeleton h-4 w-5/6 rounded-lg" />
          <div className="skeleton h-44 w-44 rounded-full" />
          <div className="skeleton h-2 w-full max-w-md rounded-full" />
          <div className="skeleton h-14 w-full max-w-md rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
