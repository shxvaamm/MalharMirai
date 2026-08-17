"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldAlert, Loader2, Lock, ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { isSuperAdminEmail, resolveUserRole, UserRole } from "@/lib/auth/rbac";
import Link from "next/link";

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AdminGuard Component
 * Role-Based Access Control (RBAC) Guard for the Admin Portal.
 * 
 * Rules:
 * - Checks the current user's role from Supabase `profiles` table (plus auth context).
 * - ONLY users with role 'admin' or 'super_admin' can view the children (Admin Portal).
 * - Logged-out users or users with role 'member' are blocked with an Access Denied screen.
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user: contextUser, role: contextRole, loading: contextLoading } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [checkingSupabase, setCheckingSupabase] = React.useState(true);
  const [dbRole, setDbRole] = React.useState<UserRole | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    setMounted(true);
    let isSubscribed = true;

    async function checkUserRoleFromProfile() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          if (isSubscribed) {
            setDbRole(null);
            setCheckingSupabase(false);
          }
          return;
        }

        const userEmail = user.email?.toLowerCase().trim();

        // 1. Direct Super Admin check
        if (isSuperAdminEmail(userEmail)) {
          if (isSubscribed) {
            setDbRole("super_admin");
            setCheckingSupabase(false);
          }
          return;
        }

        // 2. Fetch role directly from Supabase `profiles` table
        const { data: profile } = await (supabase.from("profiles") as any)
          .select("role, email")
          .eq("id", user.id)
          .maybeSingle();

        if (profile && profile.role) {
          const resolved = resolveUserRole(userEmail, profile.role as string);
          if (isSubscribed) {
            setDbRole(resolved);
            setCheckingSupabase(false);
          }
          return;
        }

        // 3. Fallback to auth metadata
        const metaRole = (user.user_metadata?.role as string) || "member";
        const resolved = resolveUserRole(userEmail, metaRole);
        if (isSubscribed) {
          setDbRole(resolved);
          setCheckingSupabase(false);
        }
      } catch (err) {
        if (isSubscribed) {
          setCheckingSupabase(false);
        }
      }
    }

    checkUserRoleFromProfile();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Compute effective role prioritizing Supabase DB profile, then Auth context
  const effectiveRole: UserRole = React.useMemo(() => {
    if (dbRole === "super_admin" || dbRole === "admin") return dbRole;
    if (contextRole === "super_admin" || contextRole === "admin") return contextRole;
    if (dbRole) return dbRole;
    return contextRole || "member";
  }, [dbRole, contextRole]);

  const isAuthorized = effectiveRole === "super_admin" || effectiveRole === "admin";
  const isLoading = !mounted || (contextLoading && checkingSupabase);

  // 1. Loading State
  if (isLoading) {
    return (
      <div
        suppressHydrationWarning
        className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-black text-neutral-200"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/10">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
        <p className="text-xs font-medium text-neutral-400">
          Verifying administrative clearance &amp; RBAC policies...
        </p>
      </div>
    );
  }

  // 2. Access Denied / Unauthorized Screen (Blocked for 'member' or logged out)
  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4 bg-black text-neutral-200">
        <div className="max-w-md w-full glass-panel border border-white/[0.08] bg-[#0D0D0D]/95 p-8 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          {/* Top lock badge */}
          <div className="h-16 w-16 mx-auto rounded-3xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 shadow-lg">
            <Lock className="h-7 w-7 text-red-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-neutral-100">
              Access Denied
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
              This area is restricted. You must be an authorized <strong className="text-neutral-200">Administrator</strong> or <strong className="text-neutral-200">Super Admin</strong> to access the Management Console.
            </p>
          </div>

          {/* Role Status Tag */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-neutral-400">
            Current Status: <span className="font-semibold text-neutral-200 capitalize">{contextUser ? `Logged in as ${effectiveRole}` : "Not Authenticated"}</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              variant="default"
              size="sm"
              className="w-full sm:w-auto text-xs rounded-full px-6 py-5 font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm flex items-center justify-center gap-2"
            >
              <Link href={`/login?redirectTo=${encodeURIComponent(pathname || "/admin")}`}>
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In with Admin Account</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs rounded-full px-5 py-5 border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white hover:bg-white/[0.07]"
            >
              <Link href="/">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                <span>Return to Website</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Render Admin Portal
  return <>{children}</>;
}

export default AdminGuard;
