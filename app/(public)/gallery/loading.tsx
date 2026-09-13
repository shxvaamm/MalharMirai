/**
 * loading.tsx — Gallery page loading skeleton (Next.js App Router)
 */
export default function GalleryLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header skeleton */}
      <div className="text-center space-y-3 max-w-xl mx-auto animate-pulse">
        <div className="h-10 sm:h-14 w-1/2 bg-neutral-800/70 rounded-2xl mx-auto" />
        <div className="h-4 w-2/3 bg-neutral-800/50 rounded-xl mx-auto" />
      </div>

      {/* Masonry grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square w-full rounded-2xl bg-neutral-900/80 animate-pulse border border-white/[0.04]"
            style={{ animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
