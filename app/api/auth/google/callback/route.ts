import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSuperAdminEmail } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { MOCK_MEMBERS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified: boolean;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const loginUrl = new URL("/login", origin);

  // 1. Check if user cancelled OAuth on Google
  if (oauthError) {
    loginUrl.searchParams.set("error", "oauth_cancelled");
    return NextResponse.redirect(loginUrl.toString());
  }

  if (!code || !state) {
    loginUrl.searchParams.set("error", "oauth_missing_code");
    return NextResponse.redirect(loginUrl.toString());
  }

  // 2. Validate CSRF State Token
  const cookieStore = cookies();
  const storedNonce = cookieStore.get("malhar_oauth_state")?.value;

  // Clear the state cookie immediately
  cookieStore.set("malhar_oauth_state", "", {
    path: "/",
    expires: new Date(0),
  });

  let redirectTo = "/admin";
  try {
    const parsedState = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8")
    );
    if (!storedNonce || parsedState.nonce !== storedNonce) {
      loginUrl.searchParams.set("error", "oauth_csrf_invalid");
      return NextResponse.redirect(loginUrl.toString());
    }
    if (parsedState.redirectTo) {
      redirectTo = parsedState.redirectTo;
    }
  } catch {
    loginUrl.searchParams.set("error", "oauth_state_malformed");
    return NextResponse.redirect(loginUrl.toString());
  }

  // 3. Exchange authorization code for Google tokens on the backend
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    loginUrl.searchParams.set("error", "oauth_not_configured");
    return NextResponse.redirect(loginUrl.toString());
  }

  let tokenData: { access_token?: string; id_token?: string; error?: string };
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    tokenData = await tokenResponse.json();
  } catch (err) {
    loginUrl.searchParams.set("error", "oauth_token_exchange_failed");
    return NextResponse.redirect(loginUrl.toString());
  }

  if (!tokenData.access_token) {
    loginUrl.searchParams.set("error", "oauth_token_invalid");
    return NextResponse.redirect(loginUrl.toString());
  }

  // 4. Retrieve verified user profile information from Google OpenID userinfo endpoint
  let googleUser: GoogleUserInfo;
  try {
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    googleUser = await userInfoResponse.json();
  } catch {
    loginUrl.searchParams.set("error", "oauth_userinfo_failed");
    return NextResponse.redirect(loginUrl.toString());
  }

  if (!googleUser.email || !googleUser.email_verified) {
    loginUrl.searchParams.set("error", "oauth_email_unverified");
    return NextResponse.redirect(loginUrl.toString());
  }

  const verifiedEmail = googleUser.email.toLowerCase().trim();

  // 5. Check if the verified Google email belongs to an existing active Admin in the database
  const isSuper = isSuperAdminEmail(verifiedEmail);
  let isApprovedAdmin = isSuper;

  if (!isApprovedAdmin) {
    // Check Supabase database profiles table
    try {
      const supabase = await createClient();
      const { data: profile } = (await (supabase.from("profiles") as any)
        .select("role, email")
        .ilike("email", verifiedEmail)
        .single()) as { data: { role: string; email: string } | null };

      if (profile && (profile.role === "admin" || profile.role === "super_admin")) {
        isApprovedAdmin = true;
      }
    } catch {
      // Fallback check against member roster
    }

    // Fallback check against known society member roster
    if (!isApprovedAdmin) {
      const rosterMember = MOCK_MEMBERS.find(
        (m) => m.email.toLowerCase() === verifiedEmail && m.role === "admin"
      );
      if (rosterMember) {
        isApprovedAdmin = true;
      }
    }
  }

  // 6. Strict Authorization Decision
  if (!isApprovedAdmin) {
    // DENY ACCESS: Do not allow random accounts to register or become Admin
    loginUrl.searchParams.set("error", "unauthorized_admin_access");
    loginUrl.searchParams.set("email", verifiedEmail);
    return NextResponse.redirect(loginUrl.toString());
  }

  // 7. Establish authenticated admin session cookies
  const role = isSuper ? "super_admin" : "admin";
  const isProduction = process.env.NODE_ENV === "production";

  const ADMIN_SECRET =
    process.env.ADMIN_SESSION_SECRET || "malhar_xK9pL3mQ_secure_admin_2026_8fTqWvNz";

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(ADMIN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(verifiedEmail));
  const hmac = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  cookieStore.set("malhar_demo_admin", hmac, {
    path: "/",
    maxAge: 86400,
    sameSite: "lax",
    secure: isProduction,
  });

  cookieStore.set("malhar_demo_role", role, {
    path: "/",
    maxAge: 86400,
    sameSite: "lax",
    secure: isProduction,
  });

  cookieStore.set("malhar_user_email", encodeURIComponent(verifiedEmail), {
    path: "/",
    maxAge: 86400,
    sameSite: "lax",
    secure: isProduction,
  });

  // Redirect to requested admin destination
  const destinationUrl = new URL(redirectTo, origin);
  return NextResponse.redirect(destinationUrl.toString());
}
