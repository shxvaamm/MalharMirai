import * as React from "react";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { HeroBackgroundSlideshow } from "@/components/public/hero-background-slideshow";
import { PageTransition } from "@/components/public/page-transition";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // bg-transparent so the global fixed background at z:-1 shows through every page
    <div className="min-h-screen flex flex-col bg-transparent text-foreground selection:bg-white selection:text-black">
      {/* Global fixed background — renders at z-index:-1, stays anchored to viewport */}
      <HeroBackgroundSlideshow intervalMs={4500} opacityClassName="opacity-85" />

      {/* All elements below are in normal document flow, auto-stacked above z:-1 */}
      <PublicNavbar />

      <main className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-transparent pt-16 md:pt-20">
        <PageTransition>{children}</PageTransition>
      </main>

      <PublicFooter />
    </div>
  );
}
