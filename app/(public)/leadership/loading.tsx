/**
 * loading.tsx — Leadership/Team page loading skeleton (Next.js App Router)
 */
export default function LeadershipLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="h-10 sm:h-14 w-1/2 bg-neutral-800/70 rounded-2xl mx-auto" />
        <div className="h-4 w-2/3 bg-neutral-800/50 rounded-xl mx-auto" />
      </div>

      {/* Leadership cards — larger */}
      <div className="space-y-3">
        <div className="h-4 w-28 bg-neutral-800/60 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border border-white/[0.06] bg-neutral-900/70 p-6 space-y-4">
              <div className="h-16 w-16 rounded-full bg-neutral-800 mx-auto" />
              <div className="space-y-2 text-center">
                <div className="h-4 w-24 bg-neutral-800 rounded mx-auto" />
                <div className="h-3 w-32 bg-neutral-800/60 rounded mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member cards — smaller grid */}
      <div className="space-y-3">
        <div className="h-4 w-28 bg-neutral-800/60 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-neutral-900/70 p-4 space-y-3">
              <div className="h-12 w-12 rounded-full bg-neutral-800 mx-auto" />
              <div className="h-3 w-20 bg-neutral-800 rounded mx-auto" />
              <div className="h-2 w-16 bg-neutral-800/60 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
