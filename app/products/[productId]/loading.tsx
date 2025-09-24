export default function ProductLoading() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-16">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="h-10 w-32 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-[480px] animate-pulse rounded-3xl bg-slate-200" />
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow">
            <div className="space-y-4">
              <div className="h-3 w-48 animate-pulse rounded-full bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200" />
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-3 w-full animate-pulse rounded-full bg-slate-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
