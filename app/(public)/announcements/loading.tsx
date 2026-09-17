/**
 * loading.tsx — Announcements page loading skeleton (Next.js App Router)
 * Shown automatically while the page server-renders, preventing blank screen.
 */
export default function AnnouncementsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 sm:space-y-10">
      {/* Header skeleton */}
      <div className="text-center space-y-4 max-w-3xl mx-auto animate-pulse">
        <div className="h-12 w-64 bg-neutral-800/60 rounded-xl mx-auto" />
        <div className="h-4 w-96 bg-neutral-800/40 rounded-lg mx-auto" />
        <div className="h-4 w-72 bg-neutral-800/30 rounded-lg mx-auto" />
      </div>

      {/* Card skeletons */}
      <div className="space-y-4 max-w-4xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-5 space-y-3 animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-14 bg-neutral-800/60 rounded-full" />
                <div className="h-4 w-10 bg-neutral-800/40 rounded-full" />
              </div>
              <div className="h-3 w-24 bg-neutral-800/40 rounded-full" />
            </div>
            <div className="h-5 w-2/3 bg-neutral-800/60 rounded-lg" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-neutral-800/30 rounded" />
              <div className="h-3 w-4/5 bg-neutral-800/20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
