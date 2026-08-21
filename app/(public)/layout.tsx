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
    <div className="min-h-screen flex flex-col bg-black text-foreground selection:bg-white selection:text-black">
      {/* Fixed cinematic background — z-0, stays anchored to viewport while everything else scrolls */}
      <HeroBackgroundSlideshow intervalMs={4500} opacityClassName="opacity-80" />

      {/* Navigation Bar — z-50 so it always sits above the background */}
      <div className="relative z-50">
        <PublicNavbar />
      </div>

      {/* Main Body Content — z-10 so text/cards scroll over the fixed background */}
      <main className="relative z-10 flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-transparent">
        <div className="relative flex-1 flex flex-col">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      {/* Footer — sits in normal flow above background */}
      <div className="relative z-10">
        <PublicFooter />
      </div>
    </div>
  );
}
