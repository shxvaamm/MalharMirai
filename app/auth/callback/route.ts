import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdminEmail, resolveUserRole, UserRole } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

// ─── HMAC signing (Edge-compatible) ──────────────────────────────────────────
const ADMIN_SECRET =
  process.env.ADMIN_SESSION_SECRET || "malhar_xK9pL3mQ_secure_admin_2026_8fTqWvNz";

async function computeHmac(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(ADMIN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * OAuth Callback Route Handler (/auth/callback)
 *
 * 1. Exchanges the OAuth authorization code for an authenticated Supabase session.
 * 2. Queries the Supabase `profiles` table to retrieve the user's assigned role.
 * 3. Sets HMAC-signed admin cookies (same as email/password login flow).
 * 4. ALL users land on /dashboard (member portal):
 *    - Admins/Super Admins see an "Admin Console" banner there to switch portals
 *    - Members see their tickets, passes, events
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // 1. Handle OAuth error returned in query string
  if (errorParam) {
    console.error(`[OAuth Callback] Provider error: ${errorParam} - ${errorDescription}`);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorParam)}&message=${encodeURIComponent(errorDescription || "")}`
    );
  }

  // 2. Exchange authorization code for a session
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[OAuth Callback] Code exchange failed:", exchangeError.message);
      return NextResponse.redirect(`${origin}/login?error=oauth_token_exchange_failed`);
    }

    // 3. Fetch current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!userError && user && user.email) {
      const userEmail = user.email.toLowerCase().trim();
      let userRole: UserRole = "member";

      // Check root Super Admin first
      if (isSuperAdminEmail(userEmail)) {
        userRole = "super_admin";
      } else {
        try {
          // Query the Supabase profiles table where id equals user.id
          const { data: profile } = await (supabase.from("profiles") as any)
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          if (profile && profile.role) {
            userRole = profile.role as UserRole;
          } else {
            // Secondary lookup by email or fallback to metadata
            const { data: emailProfile } = await (supabase.from("profiles") as any)
              .select("role")
              .eq("email", userEmail)
              .maybeSingle();

            if (emailProfile && emailProfile.role) {
              userRole = emailProfile.role as UserRole;
            } else {
              const metaRole = (user.user_metadata?.role || user.app_metadata?.role || "member") as string;
              userRole = resolveUserRole(userEmail, metaRole);
            }
          }
        } catch (dbError) {
          console.warn("[OAuth Callback] Could not query profiles table, falling back:", dbError);
          const metaRole = (user.user_metadata?.role || user.app_metadata?.role || "member") as string;
          userRole = resolveUserRole(userEmail, metaRole);
        }
      }

      const effectiveRole = resolveUserRole(userEmail, userRole);

      // 4. All users land on /dashboard (member portal).
      //    Admins/Super Admins see an "Enter Admin Console" banner from there.
      if (effectiveRole === "super_admin" || effectiveRole === "admin") {
        const hmac = await computeHmac(userEmail);
        const response = NextResponse.redirect(`${origin}/dashboard`);
        const opts = { path: "/", sameSite: "lax" as const };
        response.cookies.set("malhar_demo_admin", hmac, opts);
        response.cookies.set("malhar_demo_role", effectiveRole, opts);
        response.cookies.set("malhar_user_email", encodeURIComponent(userEmail), opts);
        return response;
      } else {
        const response = NextResponse.redirect(`${origin}/dashboard`);
        response.cookies.set("malhar_demo_role", effectiveRole, { path: "/", sameSite: "lax" });
        response.cookies.set("malhar_user_email", encodeURIComponent(userEmail), { path: "/", sameSite: "lax" });
        return response;
      }
    }
  }

  // 5. Fallback redirect if code is absent or exchange failed
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
