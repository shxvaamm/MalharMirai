/**
 * loading.tsx — Events page loading skeleton (Next.js App Router)
 * Shows instantly on navigation before the page's async data resolves.
 * Matches the structure of EventsPage so there's no layout shift.
 */
export default function EventsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header skeleton */}
      <div className="text-center space-y-3 max-w-2xl mx-auto animate-pulse">
        <div className="h-10 sm:h-14 w-2/3 bg-neutral-800/70 rounded-2xl mx-auto" />
        <div className="h-4 w-1/2 bg-neutral-800/50 rounded-xl mx-auto" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-16 bg-neutral-800/50 rounded-full animate-pulse" />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.06] bg-neutral-900/80 animate-pulse"
          >
            <div className="aspect-video w-full bg-neutral-800/60 rounded-t-2xl" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 bg-neutral-800 rounded" />
              <div className="h-3 w-1/2 bg-neutral-800/60 rounded" />
              <div className="h-3 w-2/3 bg-neutral-800/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
