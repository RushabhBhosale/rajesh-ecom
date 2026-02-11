export const metadata = {
  title: "Offline | Rajesh Renewed",
  description: "You are offline. Browse cached pages or reconnect to continue shopping.",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 px-6 py-16">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-sm">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <span className="text-lg font-bold">Offline</span>
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          You&apos;re currently offline
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          We cached key pages so you can keep browsing. Reconnect to continue checkout or refresh for the latest inventory.
        </p>
        <div className="mt-6 space-y-2 text-sm text-slate-600">
          <p>• Open cached pages from your recent session.</p>
          <p>• Pull down or tap reload once you&apos;re online.</p>
        </div>
      </div>
    </main>
  );
}
