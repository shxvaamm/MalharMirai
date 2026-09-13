import * as React from "react";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { HeroBackgroundSlideshow } from "@/components/public/hero-background-slideshow";
import { PageTransition } from "@/components/public/page-transition";
import { fetchHeroSlidesServer } from "@/lib/data/hero-slides-server";

// Revalidate the layout every 60 s — slides stay fresh without a full rebuild
export const revalidate = 60;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch slide data on the server so the slideshow client component receives
  // real URLs in its initial props — no client-side fetch waterfall on first paint.
  const initialSlides = await fetchHeroSlidesServer();
  const firstSlideUrl = initialSlides[0]?.image_url ?? null;

  return (
    // bg-transparent so the global fixed background at z:-1 shows through every page
    <div className="min-h-screen flex flex-col bg-transparent text-foreground selection:bg-white selection:text-black">
      {/* Preload the first hero image so the browser fetches it during HTML
          parsing — before React hydrates or the client JS executes. */}
      {firstSlideUrl && (
        <link
          rel="preload"
          as="image"
          href={firstSlideUrl}
          fetchPriority="high"
        />
      )}

      {/* Global fixed background — renders at z-index:-1, stays anchored to viewport */}
      <HeroBackgroundSlideshow
        intervalMs={4500}
        opacityClassName="opacity-85"
        initialSlides={initialSlides}
      />

      {/* Fixed top navbar */}
      <PublicNavbar />

      {/* Main page content - offset for fixed navbar */}
      <main className="flex-1 flex flex-col bg-transparent pt-16 md:pt-20">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Standard page footer at the end of the document */}
      <PublicFooter />
    </div>
  );
}
