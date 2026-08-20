import * as React from "react";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { PageTransition } from "@/components/public/page-transition";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-black text-foreground selection:bg-white selection:text-black relative">
      {/* Navigation Bar */}
      <PublicNavbar />

      {/* Main Body Content */}
      <main className="relative flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-black">
        <div className="relative z-10 flex-1 flex flex-col">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}

