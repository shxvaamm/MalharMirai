/**
 * loading.tsx — About page loading skeleton (Next.js App Router)
 */
export default function AboutLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 animate-pulse">
      {/* Logo + header skeleton */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="h-16 w-16 rounded-full bg-neutral-800/70 mx-auto" />
        <div className="h-10 sm:h-14 w-1/2 bg-neutral-800/70 rounded-2xl mx-auto" />
        <div className="h-4 w-3/4 bg-neutral-800/50 rounded-xl mx-auto" />
        <div className="h-4 w-2/3 bg-neutral-800/50 rounded-xl mx-auto" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {[1, 2].map((i) => (
          <div key={i} className="p-8 rounded-3xl border border-white/[0.06] bg-neutral-900/70 space-y-3 text-center">
            <div className="h-12 w-24 bg-neutral-800 rounded-xl mx-auto" />
            <div className="h-3 w-32 bg-neutral-800/60 rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-8 rounded-3xl border border-white/[0.06] bg-neutral-900/70 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-neutral-800" />
            <div className="h-5 w-24 bg-neutral-800 rounded" />
            <div className="space-y-2">
              <div className="h-3 bg-neutral-800/60 rounded w-full" />
              <div className="h-3 bg-neutral-800/60 rounded w-5/6" />
              <div className="h-3 bg-neutral-800/60 rounded w-4/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
