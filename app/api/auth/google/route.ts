import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const redirectTo = searchParams.get("redirectTo") || "/admin";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

  // If Google OAuth is not configured with environment keys yet
  if (!clientId || clientId.trim() === "") {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "oauth_not_configured");
    loginUrl.searchParams.set("redirectTo", redirectTo);
    return NextResponse.redirect(loginUrl.toString());
  }

  // Generate cryptographically secure state parameter for CSRF mitigation
  const stateNonce = crypto.randomBytes(32).toString("hex");
  const statePayload = Buffer.from(
    JSON.stringify({ nonce: stateNonce, redirectTo })
  ).toString("base64url");

  // Save state in HTTP-only cookie with short expiration (10 minutes)
  const cookieStore = cookies();
  cookieStore.set("malhar_oauth_state", stateNonce, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });

  // Construct Google OpenID Connect / OAuth 2.0 authorization URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", statePayload);
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("access_type", "offline");

  return NextResponse.redirect(googleAuthUrl.toString());
}
