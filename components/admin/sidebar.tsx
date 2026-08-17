"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  Calendar,
  ClipboardList,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  LogOut,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  superAdminOnly?: boolean;
}

const adminNavItems: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Departments", href: "/admin/departments", icon: Layers },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Members", href: "/admin/members", icon: Users },
  { name: "Core Committee", href: "/admin/leadership", icon: Crown },
  { name: "Team & Roles", href: "/admin/team", icon: Shield },
  { name: "Registrations", href: "/admin/registrations", icon: ClipboardList },
  { name: "Communication", href: "/admin/communication", icon: MessageSquare, superAdminOnly: true },
  { name: "Gallery", href: "/admin/gallery", icon: ImageIcon },
  { name: "Home Slideshow", href: "/admin/slideshow", icon: Sparkles },
  { name: "Settings", href: "/admin/settings", icon: Settings, superAdminOnly: true },
];





interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({ isMobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { role, signOut } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const isSuperAdmin = role === "super_admin" || role === "admin";

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 bg-[#0A0A0A]">
      {/* Top section: Brand & Nav */}
      <div className="space-y-6">
        {/* Brand with official Malhar Medallion Logo */}
        <div className="flex items-center justify-between px-2">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden border border-white/10 shadow-sm bg-neutral-900">
              <Image
                src="/images/malhar-logo.png"
                alt="MALHAR Logo"
                fill
                className="object-cover brightness-105"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <div className="relative h-5 w-24 mb-0.5">
                  <Image
                    src="/images/malhar-wordmark.png"
                    alt="MALHAR"
                    fill
                    className="object-contain object-left brightness-110"
                  />
                </div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5 text-neutral-400" /> Admin Console
                </span>
              </div>
            )}
          </Link>

          {/* Desktop collapse button */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            const isRestricted = item.superAdminOnly && !isSuperAdmin;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/[0.08] text-neutral-100 font-semibold border-l-2 border-neutral-300 shadow-sm"
                    : "text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200",
                  isRestricted && "opacity-60"
                )}
                title={collapsed ? item.name : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-neutral-200" : "text-neutral-400")} />
                  {!collapsed && <span>{item.name}</span>}
                </div>

                {!collapsed && item.superAdminOnly && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-neutral-400 uppercase font-semibold">
                    Super
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: Public Site Link & Sign Out */}
      <div className="space-y-2 pt-4 border-t border-white/[0.06]">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-medium text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200 transition-colors"
        >
          <ExternalLink className="h-4 w-4 shrink-0 text-neutral-400" />
          {!collapsed && <span>View Main Website</span>}
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className={cn(
            "w-full justify-start text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl text-xs",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2.5">{isLoggingOut ? "Signing out..." : "Sign Out"}</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-white/[0.06] bg-[#0A0A0A] transition-all duration-300 sticky top-0 h-screen z-30",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full bg-[#0A0A0A] border-r border-white/[0.06] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

