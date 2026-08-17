"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  hasPermission,
  AdminPermission,
  UserRole,
  getRoleDisplayName,
  isSuperAdminEmail,
  resolveUserRole,
} from "@/lib/auth/rbac";
import { getRegisteredCredentials, getActiveSuperAdminEmail } from "@/lib/auth/credentials-store";

import { getSyncedData, STORAGE_KEYS } from "@/lib/store/sync-store";
import { ClubMember, MOCK_MEMBERS } from "@/lib/mock-data";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  loading: boolean;
  can: (permission: AdminPermission) => boolean;
  signOut: () => Promise<void>;
  switchDemoRole: (newRole: UserRole) => void;
  loginAsQuickAdmin: (email?: string, targetRole?: UserRole) => void;
}

function getInitialAuthState(): { user: AuthUser | null; role: UserRole; loading: boolean } {
  if (typeof window === "undefined") {
    return { user: null, role: "member", loading: false };
  }

  try {
    // Check for HMAC-signed admin cookie (must be 64-char hex, not just "true")
    const adminCookieMatch = document.cookie.match(/malhar_demo_admin=([^;]+)/);
    const adminCookieValue = adminCookieMatch ? adminCookieMatch[1] : '';
    const isDemoAdminCookie = adminCookieValue.length === 64 && /^[0-9a-f]+$/.test(adminCookieValue);
    let storedEmail = localStorage.getItem("malhar_current_user_email");

    if (!storedEmail) {
      const emailCookie = document.cookie.match(/malhar_user_email=([^;]+)/);
      if (emailCookie) {
        storedEmail = decodeURIComponent(emailCookie[1]);
      }
    }

    const cookieRoleMatch = document.cookie.match(/malhar_demo_role=([^;]+)/);
    const storedRole = (cookieRoleMatch ? cookieRoleMatch[1] : null) as UserRole | null;

    if (isDemoAdminCookie && storedEmail) {
      const activeEmail = storedEmail.trim().toLowerCase();
      const activeSuper = getActiveSuperAdminEmail();
      const isSuper = storedRole === "super_admin" || isSuperAdminEmail(activeEmail) || activeEmail === activeSuper;

      const membersList = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
      const member = membersList.find((m) => m.email.toLowerCase() === activeEmail);
      const isPromotedAdmin = member?.role === "admin";

      const effectiveRole: UserRole = isSuper
        ? "super_admin"
        : (isPromotedAdmin || storedRole === "admin" ? "admin" : "member");

      if (effectiveRole === "super_admin" || effectiveRole === "admin") {
        const registered = getRegisteredCredentials().find((c) => c.email.toLowerCase() === activeEmail);

        const fullName =
          registered?.fullName ||
          member?.full_name ||
          (isSuper ? "Shivam Kumar (Super Admin)" : "Administrator");

        const currentUser: AuthUser = {
          id: member?.id || `user-${activeEmail}`,
          email: activeEmail,
          fullName,
          role: effectiveRole,
          avatarUrl: member?.avatar_url,
          department: registered?.department || member?.department || "General",
        };

        return { user: currentUser, role: effectiveRole, loading: false };
      }
    }
  } catch {
    // Fallback
  }

  return { user: null, role: "member", loading: false };
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [initial] = React.useState(getInitialAuthState);
  const [user, setUser] = React.useState<AuthUser | null>(initial.user);
  const [role, setRole] = React.useState<UserRole>(initial.role);
  const [loading, setLoading] = React.useState(initial.loading);

  // Initialize session state on mount
  React.useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        setLoading(true);

        // 1. Check cookies & local storage
        const isDemoAdminCookie = typeof document !== "undefined" &&
          document.cookie.includes("malhar_demo_admin=true");

        let storedEmail = typeof window !== "undefined"
          ? localStorage.getItem("malhar_current_user_email")
          : null;

        if (!storedEmail && typeof document !== "undefined") {
          const emailCookie = document.cookie.match(/malhar_user_email=([^;]+)/);
          if (emailCookie) {
            storedEmail = decodeURIComponent(emailCookie[1]);
          }
        }

        const cookieRoleMatch = typeof document !== "undefined"
          ? document.cookie.match(/malhar_demo_role=([^;]+)/)
          : null;
        const storedRole = (cookieRoleMatch ? cookieRoleMatch[1] : null) as UserRole | null;

        // Establish session ONLY if explicit authenticated credentials exist
        if (isDemoAdminCookie && storedEmail) {
          const activeEmail = storedEmail.trim().toLowerCase();
          const activeSuper = getActiveSuperAdminEmail();
          const isSuper = storedRole === "super_admin" || isSuperAdminEmail(activeEmail) || activeEmail === activeSuper;

          const membersList = typeof window !== "undefined"
            ? getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS)
            : MOCK_MEMBERS;
          const member = membersList.find((m) => m.email.toLowerCase() === activeEmail);
          const isPromotedAdmin = member?.role === "admin";

          const effectiveRole: UserRole = isSuper
            ? "super_admin"
            : (isPromotedAdmin || storedRole === "admin" ? "admin" : "member");

          if (effectiveRole === "super_admin" || effectiveRole === "admin") {
            const registered = typeof window !== "undefined"
              ? getRegisteredCredentials().find((c) => c.email.toLowerCase() === activeEmail)
              : null;

            const fullName =
              registered?.fullName ||
              member?.full_name ||
              (isSuper ? "Shivam Kumar (Super Admin)" : "Administrator");

            const currentUser: AuthUser = {
              id: member?.id || `user-${activeEmail}`,
              email: activeEmail,
              fullName,
              role: effectiveRole,
              avatarUrl: member?.avatar_url,
              department: registered?.department || member?.department || "General",
            };

            if (isMounted) {
              setUser(currentUser);
              setRole(effectiveRole);
              setLoading(false);
            }
            return;
          }
        }

        // 2. Check Supabase Auth Session with safety timeout (1200ms)

        try {
          const supabase = createClient();
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
            setTimeout(() => resolve({ data: { session: null } }), 1200)
          );

          const result = await Promise.race([sessionPromise, timeoutPromise]);
          const session = result?.data?.session;

          if (session && session.user && session.user.email) {
            const userEmail = session.user.email.toLowerCase().trim();
            const isSuper = isSuperAdminEmail(userEmail);
            const membersList = typeof window !== "undefined"
              ? getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS)
              : MOCK_MEMBERS;
            const member = membersList.find((m) => m.email.toLowerCase() === userEmail);
            const isPromotedAdmin = member?.role === "admin";
            const effectiveRole: UserRole = isSuper
              ? "super_admin"
              : (isPromotedAdmin ? "admin" : "member");

            if (isMounted) {
              setUser({
                id: session.user.id,
                email: userEmail,
                fullName: isSuper
                  ? "Shivam Kumar (Super Admin)"
                  : (session.user.user_metadata?.full_name || member?.full_name || "User"),
                role: effectiveRole,
                avatarUrl: session.user.user_metadata?.avatar_url || member?.avatar_url,
                department: member?.department || "General",
              });
              setRole(effectiveRole);
            }
            return;
          }
        } catch {
          // Supabase auth query fallback
        }

        if (isMounted) {
          setUser(null);
          setRole("member");
        }

      } catch (err) {
        if (isMounted) {
          setUser(null);
          setRole("member");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // 3. Listen for real-time Supabase Auth state changes (OAuth sign-in, tokens)
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    try {
      const supabase = createClient();
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        if (event === "SIGNED_IN" && session?.user?.email) {
          const userEmail = session.user.email.toLowerCase().trim();
          const isSuper = isSuperAdminEmail(userEmail);
          const membersList = typeof window !== "undefined"
            ? getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS)
            : MOCK_MEMBERS;
          const member = membersList.find((m) => m.email.toLowerCase() === userEmail);
          const isPromotedAdmin = member?.role === "admin";
          const registered = typeof window !== "undefined"
            ? getRegisteredCredentials().find((c) => c.email.toLowerCase() === userEmail)
            : null;
          const isRegisteredAdmin = registered?.role === "admin" || registered?.role === "super_admin";
          const effectiveRole: UserRole = isSuper
            ? "super_admin"
            : (isPromotedAdmin || isRegisteredAdmin ? "admin" : "member");

          const hasAdminAccess = effectiveRole === "super_admin" || effectiveRole === "admin";
          if (hasAdminAccess) {
            document.cookie = "malhar_demo_admin=true; path=/; max-age=86400; SameSite=Lax";
          } else {
            document.cookie = "malhar_demo_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          }
          document.cookie = `malhar_demo_role=${effectiveRole}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `malhar_user_email=${encodeURIComponent(userEmail)}; path=/; max-age=86400; SameSite=Lax`;

          if (typeof window !== "undefined") {
            localStorage.setItem("malhar_current_user_email", userEmail);
            localStorage.setItem("malhar_current_user_role", effectiveRole);
          }

          setUser({
            id: session.user.id,
            email: userEmail,
            fullName: isSuper
              ? "Shivam Kumar (Super Admin)"
              : (registered?.fullName || session.user.user_metadata?.full_name || member?.full_name || "User"),
            role: effectiveRole,
            avatarUrl: session.user.user_metadata?.avatar_url || member?.avatar_url,
            department: registered?.department || member?.department || "General",
          });
          setRole(effectiveRole);
          setLoading(false);
        } else if (event === "SIGNED_OUT") {
          document.cookie = "malhar_demo_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "malhar_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "malhar_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

          if (typeof window !== "undefined") {
            localStorage.removeItem("malhar_current_user_email");
            localStorage.removeItem("malhar_current_user_role");
          }

          setUser(null);
          setRole("member");
        }

      });
      authListener = data;
    } catch {
      // Ignore listener error if offline
    }

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);


  const can = React.useCallback(
    (permission: AdminPermission) => {
      return hasPermission(role, permission);
    },
    [role]
  );

  const loginAsQuickAdmin = (
    email: string = "shvxamkumar@gmail.com",
    targetRole?: UserRole
  ) => {
    const normalizedEmail = email.trim().toLowerCase();
    const isSuper = isSuperAdminEmail(normalizedEmail) || targetRole === "super_admin";

    const membersList = typeof window !== "undefined"
      ? getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS)
      : MOCK_MEMBERS;
    const member = membersList.find((m) => m.email.toLowerCase() === normalizedEmail);
    const isPromotedAdmin = member?.role === "admin";

    const effectiveRole: UserRole = isSuper
      ? "super_admin"
      : (targetRole ? targetRole : (isPromotedAdmin ? "admin" : "member"));

    const hasAdminAccess = effectiveRole === "super_admin" || effectiveRole === "admin";

    // ─── Update React state (cookie is set by grantAdminSession in login page)
    if (!hasAdminAccess) {
      // Clear admin cookies if not admin
      document.cookie = "malhar_demo_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "malhar_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    document.cookie = `malhar_user_email=${encodeURIComponent(normalizedEmail)}; path=/; max-age=86400; SameSite=Lax`;

    if (typeof window !== "undefined") {
      localStorage.setItem("malhar_current_user_email", normalizedEmail);
      localStorage.setItem("malhar_current_user_role", effectiveRole);
    }

    const registered = typeof window !== "undefined"
      ? getRegisteredCredentials().find((c) => c.email.toLowerCase() === normalizedEmail)
      : null;

    const fullName =
      registered?.fullName ||
      member?.full_name ||
      (isSuper ? "Shivam Kumar (Super Admin)" : (effectiveRole === "admin" ? "Administrator" : "User"));

    const currentUser: AuthUser = {
      id: member?.id || `user-${normalizedEmail}`,
      email: normalizedEmail,
      fullName,
      role: effectiveRole,
      avatarUrl: member?.avatar_url,
      department: registered?.department || member?.department || "General",
    };

    setUser(currentUser);
    setRole(effectiveRole);
    setLoading(false);
  };


  const switchDemoRole = (newRole: UserRole) => {
    document.cookie = `malhar_demo_role=${newRole}; path=/; max-age=86400; SameSite=Lax`;
    setRole(newRole);
    if (user) {
      setUser({
        ...user,
        role: newRole,
        fullName: newRole === "super_admin" ? "Shivam Kumar (Super Admin)" : "Administrator",
      });
    }
  };

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      // Clear all auth cookies and local storage items
      document.cookie = "malhar_demo_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "malhar_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "malhar_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      if (typeof window !== "undefined") {
        localStorage.removeItem("malhar_current_user_email");
        localStorage.removeItem("malhar_current_user_role");
      }

      setUser(null);
      setRole("member");
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        can,
        signOut,
        switchDemoRole,
        loginAsQuickAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

