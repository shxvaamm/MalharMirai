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

function resolveStoredSession(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    // 1. Get stored email from localStorage or cookie
    let storedEmail = localStorage.getItem("malhar_current_user_email");
    if (!storedEmail) {
      const emailCookie = document.cookie.match(/malhar_user_email=([^;]+)/);
      if (emailCookie) {
        storedEmail = decodeURIComponent(emailCookie[1]);
      }
    }

    if (!storedEmail) return null;
    const activeEmail = storedEmail.trim().toLowerCase();
    if (!activeEmail) return null;

    // 2. Get stored role from cookie or localStorage
    let storedRole: UserRole = "member";
    const roleCookieMatch = document.cookie.match(/malhar_demo_role=([^;]+)/);
    if (roleCookieMatch && roleCookieMatch[1]) {
      storedRole = roleCookieMatch[1] as UserRole;
    } else {
      const localRole = localStorage.getItem("malhar_current_user_role");
      if (localRole) storedRole = localRole as UserRole;
    }

    // 3. Check for admin HMAC cookie
    const adminCookieMatch = document.cookie.match(/malhar_demo_admin=([^;]+)/);
    const adminCookieValue = adminCookieMatch ? adminCookieMatch[1] : "";
    const hasAdminHmac = adminCookieValue.length === 64 && /^[0-9a-f]+$/.test(adminCookieValue);

    const activeSuper = getActiveSuperAdminEmail();
    const isSuper = isSuperAdminEmail(activeEmail) || activeEmail === activeSuper || storedRole === "super_admin";

    const membersList = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
    const member = membersList.find((m) => m.email.toLowerCase() === activeEmail);
    const isPromotedAdmin = member?.role === "admin";
    const registered = getRegisteredCredentials().find((c) => c.email.toLowerCase() === activeEmail);
    const isRegisteredAdmin = registered?.role === "admin" || registered?.role === "super_admin";

    let effectiveRole: UserRole = "member";
    if (isSuper) {
      effectiveRole = "super_admin";
    } else if (hasAdminHmac || isPromotedAdmin || isRegisteredAdmin || storedRole === "admin") {
      effectiveRole = "admin";
    } else {
      effectiveRole = "member";
    }

    const fullName =
      registered?.fullName ||
      member?.full_name ||
      (isSuper ? "Shivam Kumar (Super Admin)" : (effectiveRole === "admin" ? "Administrator" : activeEmail.split("@")[0]));

    const currentUser: AuthUser = {
      id: member?.id || (registered as any)?.id || `user-${activeEmail}`,
      email: activeEmail,
      fullName,
      role: effectiveRole,
      avatarUrl: member?.avatar_url,
      department: registered?.department || member?.department || "General",
    };

    return currentUser;
  } catch {
    return null;
  }
}

function getInitialAuthState(): { user: AuthUser | null; role: UserRole; loading: boolean } {
  const user = resolveStoredSession();
  return {
    user,
    role: user ? user.role : "member",
    loading: false,
  };
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [initial] = React.useState(getInitialAuthState);
  const [user, setUser] = React.useState<AuthUser | null>(initial.user);
  const [role, setRole] = React.useState<UserRole>(initial.role);
  const [loading, setLoading] = React.useState(false);

  // Initialize and verify session state on mount / route changes
  React.useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // 1. Synchronous check from storage/cookies
      const storedUser = resolveStoredSession();
      if (storedUser) {
        if (isMounted) {
          setUser(storedUser);
          setRole(storedUser.role);
          setLoading(false);
        }
        return;
      }

      // 2. Check Supabase Auth session if no local session marker was found
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
          const registered = typeof window !== "undefined"
            ? getRegisteredCredentials().find((c) => c.email.toLowerCase() === userEmail)
            : null;
          const isRegisteredAdmin = registered?.role === "admin" || registered?.role === "super_admin";
          const effectiveRole: UserRole = isSuper
            ? "super_admin"
            : (isPromotedAdmin || isRegisteredAdmin ? "admin" : "member");

          const hasAdminAccess = effectiveRole === "super_admin" || effectiveRole === "admin";
          if (hasAdminAccess) {
            fetch("/api/auth/admin-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ email: userEmail, role: effectiveRole }),
            }).catch(() => {});
          }

          document.cookie = `malhar_demo_role=${effectiveRole}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `malhar_user_email=${encodeURIComponent(userEmail)}; path=/; max-age=86400; SameSite=Lax`;

          if (typeof window !== "undefined") {
            localStorage.setItem("malhar_current_user_email", userEmail);
            localStorage.setItem("malhar_current_user_role", effectiveRole);
          }

          if (isMounted) {
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
          }
          return;
        }
      } catch {
        // Supabase query fallback
      }

      // 3. No session found at all
      if (isMounted) {
        setUser(null);
        setRole("member");
        setLoading(false);
      }
    }

    initAuth();

    // Listen for real-time Supabase Auth state changes (OAuth sign-in, token refresh)
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
            fetch("/api/auth/admin-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ email: userEmail, role: effectiveRole }),
            }).catch(() => {});
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

    // Set cookie and localStorage for role & email for ALL users
    if (!hasAdminAccess) {
      document.cookie = "malhar_demo_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    document.cookie = `malhar_demo_role=${effectiveRole}; path=/; max-age=86400; SameSite=Lax`;
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
      (isSuper ? "Shivam Kumar (Super Admin)" : (effectiveRole === "admin" ? "Administrator" : normalizedEmail.split("@")[0]));

    const currentUser: AuthUser = {
      id: member?.id || (registered as any)?.id || `user-${normalizedEmail}`,
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
    if (typeof window !== "undefined") {
      localStorage.setItem("malhar_current_user_role", newRole);
    }
    setRole(newRole);
    if (user) {
      setUser({
        ...user,
        role: newRole,
        fullName: newRole === "super_admin" ? "Shivam Kumar (Super Admin)" : (newRole === "admin" ? "Administrator" : user.fullName),
      });
    }
  };

  const signOut = async () => {
    try {
      const supabase = createClient();
      // scope:'local' ends the session in THIS browser only.
      // It does NOT revoke the user's account or delete their data on any table.
      // Supabase profile, registrations, and all backend data remain intact.
      // The user can log back in at any time and see the same data.
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // ignore Supabase errors — still clear local session markers below
    } finally {
      // Clear ONLY the three session-token cookies and the two auth-state markers.
      // All actual application data (synced events, members, registrations, credentials)
      // stored in localStorage under malhar_synced_* keys is intentionally NOT touched.
      // Logout ≠ Delete Account.
      document.cookie = "malhar_demo_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "malhar_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "malhar_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      if (typeof window !== "undefined") {
        // Only remove the "who is currently logged in" markers, not any user data.
        localStorage.removeItem("malhar_current_user_email");
        localStorage.removeItem("malhar_current_user_role");
        // malhar_registered_credentials, malhar_synced_*, etc. are deliberately preserved.
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

