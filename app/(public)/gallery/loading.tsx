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
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4">
        {[280, 400, 320, 460, 300, 380, 340, 440, 290, 410, 310, 430].map((h, i) => (
          <div
            key={i}
            className="break-inside-avoid mb-3 sm:mb-4 rounded-2xl sm:rounded-3xl bg-[#0D0D0D]/90 border border-white/[0.06] overflow-hidden animate-pulse shadow-lg"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div
              className="w-full bg-neutral-900/80"
              style={{ height: `${h * 0.65}px` }}
            />
            <div className="p-3.5 sm:p-4 space-y-2 border-t border-white/[0.04]">
              <div className="h-3 w-12 bg-neutral-800/80 rounded-full" />
              <div className="h-4 w-3/4 bg-neutral-800/60 rounded-md" />
              <div className="h-3 w-1/2 bg-neutral-800/40 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
