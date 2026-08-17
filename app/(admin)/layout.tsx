"use client";

import * as React from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { AdminAuthGuard } from "@/components/admin/auth-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <AdminAuthGuard>
      <div suppressHydrationWarning className="flex min-h-screen bg-black text-neutral-200 antialiased selection:bg-white selection:text-black">
        {/* Admin Sidebar Navigation */}
        <AdminSidebar
          isMobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Admin Main Body */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-black">
          <AdminHeader
            onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
          />
          <main className="page-fade-in flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#080808]">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>

  );
}

