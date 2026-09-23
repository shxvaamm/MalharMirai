import * as React from "react";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { HeroBackgroundSlideshow } from "@/components/public/hero-background-slideshow";
import { PageTransition } from "@/components/public/page-transition";
import { fetchHeroSlidesServer } from "@/lib/data/hero-slides-server";
import { fetchAnnouncementsServer } from "@/lib/data/announcements-server";
import { EmergencyBanner } from "@/components/public/emergency-banner";
import { AnnouncementsProvider } from "@/lib/context/announcements-context";

// Revalidate the layout every 60 s — slides stay fresh without a full rebuild
export const revalidate = 60;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch slide + announcement data in parallel — zero sequential waterfall
  const [initialSlides, initialAnnouncements] = await Promise.all([
    fetchHeroSlidesServer(),
    fetchAnnouncementsServer(),
  ]);
  const firstSlideUrl = initialSlides[0]?.image_url ?? null;

  return (
    // AnnouncementsProvider creates exactly ONE Supabase Realtime channel for all
    // public-page consumers (EmergencyBanner + AnnouncementsContent). It lives here
    // in the layout so it persists across client-side navigations without remounting.
    <AnnouncementsProvider initialAnnouncements={initialAnnouncements}>
      {/* bg-transparent so the global fixed background at z:-1 shows through every page */}
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
          opacityClassName="opacity-45"
          initialSlides={initialSlides}
        />

        {/* Emergency banner — reads announcements from context, no own channel */}
        <EmergencyBanner />

        {/* Fixed top navbar */}
        <PublicNavbar />

        {/* Main page content */}
        <main className="flex-1 flex flex-col bg-transparent">
          <PageTransition>{children}</PageTransition>
        </main>

        {/* Standard page footer at the end of the document */}
        <PublicFooter />
      </div>
    </AnnouncementsProvider>
  );
}
