"use client";

import * as React from "react";
import {
  Menu,
  Bell,
  Shield,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { getRoleDisplayName, getRoleBadgeColor, UserRole } from "@/lib/auth/rbac";

interface AdminHeaderProps {
  onMobileMenuToggle: () => void;
  userEmail?: string;
  userRole?: string;
}

export function AdminHeader({ onMobileMenuToggle }: AdminHeaderProps) {
  const { user, role, signOut, switchDemoRole } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);
    await signOut();
  };

  const currentEmail = user?.email || "shvxamkumar@gmail.com";
  const currentRoleName = getRoleDisplayName(role);
  const badgeColorClass = getRoleBadgeColor(role);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-white/[0.06] bg-[#0D0D0D]/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      {/* Left: Mobile Sidebar Trigger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="font-semibold text-neutral-200">MALHAR</span>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400 font-medium capitalize">Management Console</span>
        </div>
      </div>

      {/* Right: Role Badge, Role Switcher & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Permanent Role Badge */}
        <div
          suppressHydrationWarning
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-xs font-medium text-neutral-300 backdrop-blur-md"
        >
          {role === "super_admin" ? (
            <Crown className="h-3.5 w-3.5 text-neutral-300" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 text-neutral-400" />
          )}
          <span>{currentRoleName}</span>
        </div>

        {/* User preview & Sign Out */}
        <div className="flex items-center gap-2.5 border-l border-white/[0.06] pl-3 sm:pl-4">
          <div
            suppressHydrationWarning
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 border border-white/10 text-neutral-200 font-semibold text-xs shadow-sm"
          >
            {currentEmail.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span
              suppressHydrationWarning
              className="text-xs font-medium text-neutral-200 truncate max-w-[140px]"
            >
              {user?.fullName || "Admin User"}
            </span>
            <span
              suppressHydrationWarning
              className="text-[10px] text-neutral-500 truncate max-w-[140px]"
            >
              {currentEmail}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isSigningOut}
            className="h-8 w-8 p-0 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20 ml-1 rounded-full"
            title="Sign out of Admin Console"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

