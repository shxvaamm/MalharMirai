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
    <div className="min-h-screen flex flex-col bg-black text-foreground selection:bg-white selection:text-black relative">
      {/* Navigation Bar - Strictly outside & above slideshow with its own backdrop */}

      <PublicNavbar />

      {/* Main Body Content - Hosts the global background slideshow strictly between Navbar and Footer */}
      <main className="relative flex-1 flex flex-col min-h-[calc(100vh-140px)] overflow-hidden">
        <HeroBackgroundSlideshow intervalMs={4500} opacityClassName="opacity-70" />
        <div className="relative z-10 flex-1 flex flex-col">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      {/* Footer - Strictly outside & below slideshow with its own background */}
      <PublicFooter />
    </div>
  );
}

