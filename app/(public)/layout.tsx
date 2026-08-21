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
