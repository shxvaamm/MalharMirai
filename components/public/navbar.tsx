"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Menu,
  X,
  Calendar,
  Image as ImageIcon,
  Bell,
  Mail,
  Info,
  Shield,
  Users,
  Crown,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth/auth-context";

const navLinks = [
  { name: "Home", href: "/", icon: Sparkles },
  { name: "About", href: "/about", icon: Info },
  { name: "Members", href: "/members", icon: Users },
  { name: "Core", href: "/leadership", icon: Crown },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Gallery", href: "/gallery", icon: ImageIcon },
  { name: "Announcements", href: "/announcements", icon: Bell },
  { name: "Contact", href: "/contact", icon: Mail },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-xl border-b border-white/[0.06] transition-all duration-300">
      <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand: MALHAR Wordmark */}
        <Link href="/" className="flex items-center justify-center py-1 group shrink-0 select-none" id="navbar-logo">
          <div className="relative h-8 sm:h-9 w-32 sm:w-40 flex items-center justify-center select-none">
            <Image
              src="/images/malhar-wordmark.png"
              alt="MALHAR"
              fill
              unoptimized
              draggable={false}
              className="object-contain object-left group-hover:brightness-110 transition-all drop-shadow-[0_2px_10px_rgba(255,255,255,0.08)] pointer-events-none select-none"
              priority
            />
          </div>
        </Link>


        {/* Desktop Navigation Links - Soft off-white pills */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                id={`nav-link-${link.name.toLowerCase()}`}
                className={cn(
                  "relative px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
                  isActive
                    ? "bg-neutral-200 text-neutral-950 font-semibold shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.05]"
                )}
              >
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>


        {/* Action Button & Seamless Mirai Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* CTA Button: Dashboard when logged in, Login when logged out */}
          {user ? (
            <Link
              href="/dashboard"
              id="navbar-dashboard-btn"
              className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold bg-neutral-200 text-neutral-950 hover:bg-neutral-300 shadow-sm active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login"
              id="navbar-login-btn"
              className="hidden sm:inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold bg-neutral-200 text-neutral-950 hover:bg-neutral-300 shadow-sm active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
            >
              <span>Login</span>
            </Link>
          )}

          {/* Official Mirai Logo - Seamlessly blended on navbar background */}
          <div className="hidden sm:flex items-center pl-1 select-none">
            <Image
              src="/images/mirai-logo.png"
              alt="Mirai School of Technology"
              width={120}
              height={26}
              draggable={false}
              className="h-6 w-auto object-contain brightness-110 opacity-80 hover:opacity-100 transition-opacity pointer-events-none select-none"
              priority
              unoptimized
            />
          </div>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex lg:hidden items-center justify-center rounded-full p-2 text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200 transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-black/95 backdrop-blur-2xl border-t border-white/[0.06] animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1.5 px-4 pt-3 pb-6 max-h-[80vh] overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors",
                    isActive
                      ? "bg-neutral-200 text-neutral-950 font-semibold shadow-sm"
                      : "text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-white/[0.06] space-y-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 rounded-full py-3 font-semibold text-xs bg-neutral-200 text-neutral-950 hover:bg-neutral-300 shadow-sm transition-all"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await signOut();
                    }}
                    className="w-full flex items-center justify-center rounded-full py-2.5 font-medium text-xs text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all"
                  >
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center rounded-full py-3 font-semibold text-xs bg-neutral-200 text-neutral-950 hover:bg-neutral-300 shadow-sm transition-all"
                >
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

