"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LogIn,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  UserPlus,
  User,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { SUPER_ADMIN_EMAILS, UserRole, isSuperAdminEmail, resolveUserRole } from "@/lib/auth/rbac";
import {
  registerAccountCredential,
  verifyCredentials,
  appointNewAdmin,
} from "@/lib/auth/credentials-store";
import { MOCK_MEMBERS, ClubMember } from "@/lib/mock-data";
import { getSyncedData, STORAGE_KEYS } from "@/lib/store/sync-store";
import { useAuth } from "@/lib/auth/auth-context";
import { validateEmail } from "@/lib/validation/phone-email";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const errorParam = searchParams.get("error");
  const emailParam = searchParams.get("email");
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  const { loginAsQuickAdmin, user: currentUser, role: currentRole, loading: authLoading } = useAuth();

  // ─── If already authenticated, redirect to destination portal immediately
  React.useEffect(() => {
    if (!authLoading && currentUser) {
      router.replace(redirectTo || "/dashboard");
    }
  }, [authLoading, currentUser, redirectTo, router]);

  // ─── Sets HMAC-signed admin cookie server-side BEFORE navigating to /admin ───
  const grantAdminSession = React.useCallback(
    async (email: string, role: UserRole) => {
      loginAsQuickAdmin(email, role);
      const isAdmin = role === "super_admin" || role === "admin";
      if (isAdmin) {
        try {
          await fetch("/api/auth/admin-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // ← required so browser stores the Set-Cookie response
            body: JSON.stringify({ email, role }),
          });
        } catch {
          // best-effort; middleware will deny and redirect to login if cookie missing
        }
      }
    },
    [loginAsQuickAdmin]
  );

  const [mode, setMode] = React.useState<"login" | "register" | "forgot">(initialMode);

  // Sign In state
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [showLoginPassword, setShowLoginPassword] = React.useState(false);

  // Registration state
  const [regFullName, setRegFullName] = React.useState("");
  const [regEmail, setRegEmail] = React.useState("");
  const [regPassword, setRegPassword] = React.useState("");
  const [regConfirmPassword, setRegConfirmPassword] = React.useState("");
  const [showRegPassword, setShowRegPassword] = React.useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = React.useState(false);


  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [forgotEmail, setForgotEmail] = React.useState("");

  React.useEffect(() => {
    if (errorParam === "admin_only_access" || errorParam === "unauthorized_admin_access") {
      setErrorMessage(
        emailParam
          ? `Access Restricted: Account "${decodeURIComponent(
              emailParam
            )}" is not an authorized Administrator. Only designated Admins and the Super Admin (shvxamkumar@gmail.com) are permitted to log in.`
          : "Access Restricted: Only designated Administrators and the Super Admin (shvxamkumar@gmail.com) are permitted to log in. Other members cannot log in through this portal."
      );
    } else if (errorParam === "oauth_cancelled") {
      setErrorMessage("Authentication was cancelled.");
    } else if (errorParam === "oauth_failed") {
      setErrorMessage("Google authentication failed. Please try again.");
    }
  }, [errorParam, emailParam]);

  // Handle Google OAuth Sign-In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();
      const callbackUrl = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : "";

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            prompt: "select_account",
            access_type: "offline",
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || "Failed to initiate Google authentication.");
        setGoogleLoading(false);
      }
      // If successful, Supabase automatically redirects to Google OAuth endpoint
    } catch (err: any) {
      setErrorMessage(err?.message || "Google authentication failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  // Handle login with email & password (Supabase Auth + Role Check + Fallback)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const inputEmail = loginEmail.trim().toLowerCase();
    const inputPass = loginPassword.trim();

    if (!inputEmail || !inputPass) {
      setErrorMessage("Please enter both your email address and password.");
      setLoading(false);
      return;
    }

    const emailCheck = validateEmail(inputEmail);
    if (!emailCheck.valid) {
      setErrorMessage(emailCheck.error || "Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // 1. Primary Auth: Authenticate using Supabase Auth signInWithPassword
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailCheck.normalizedEmail,
        password: inputPass,
      });

      if (!authError && authData?.user) {
        const user = authData.user;
        const userEmail = (user.email || emailCheck.normalizedEmail).toLowerCase().trim();
        let userRole: UserRole = "member";

        // Check Super Admin root
        if (isSuperAdminEmail(userEmail)) {
          userRole = "super_admin";
        } else {
          try {
            // 1. Check profiles table
            const { data: profile } = await (supabase.from("profiles") as any)
              .select("role")
              .eq("id", user.id)
              .maybeSingle();

            if (profile?.role && profile.role !== "member") {
              userRole = profile.role as UserRole;
            } else {
              // 2. Check club_members table by email (catches admin promotions)
              const { data: clubMember } = await (supabase.from("club_members") as any)
                .select("role")
                .eq("email", userEmail)
                .maybeSingle();

              if (clubMember?.role === "admin" || clubMember?.role === "super_admin") {
                userRole = "admin";
              } else {
                // 3. Fall back to user metadata
                const metaRole = (user.user_metadata?.role || user.app_metadata?.role || "member") as string;
                userRole = resolveUserRole(userEmail, metaRole);
              }
            }
          } catch (profileErr) {
            console.warn("[Login] Could not query role:", profileErr);
            const metaRole = (user.user_metadata?.role || user.app_metadata?.role || "member") as string;
            userRole = resolveUserRole(userEmail, metaRole);
          }
        }

        const effectiveRole = resolveUserRole(userEmail, userRole);
        await grantAdminSession(userEmail, effectiveRole);

        // All users land on the member portal — admins see an "Admin Console" button there
        setSuccessMessage(`Signed in successfully! Opening your portal...`);
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // 2. Secondary fallback: Local credentials store (supports offline/demo logins)
      const verification = verifyCredentials(emailCheck.normalizedEmail, inputPass);
      if (verification.valid) {
        const effectiveRole = resolveUserRole(emailCheck.normalizedEmail, verification.role);
        await grantAdminSession(emailCheck.normalizedEmail, effectiveRole);

        // All users land on the member portal — admins see an "Admin Console" button there
        setSuccessMessage(`Signed in successfully! Opening your portal...`);
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // 3. Display specific error message
      if (authError) {
        setErrorMessage(authError.message || "Invalid email or password.");
      } else if (verification.error) {
        setErrorMessage(verification.error);
      } else {
        setErrorMessage("Invalid email or password. Please check your credentials.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // Handle registration for new users
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullName = regFullName.trim();
    const email = regEmail.trim().toLowerCase();
    const password = regPassword.trim();

    if (!fullName || fullName.length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      setLoading(false);
      return;
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setErrorMessage(emailCheck.error || "Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (password !== regConfirmPassword.trim()) {
      setErrorMessage("Passwords do not match. Please re-enter your password.");
      setLoading(false);
      return;
    }

    try {
      // ─── Step 1: Server-side admin check (service role, bypasses RLS)
      let isConfirmedAdmin = false;
      let confirmedAdminMember: any = null;

      try {
        const adminCheckRes = await fetch("/api/check-admin-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailCheck.normalizedEmail }),
        });
        const adminCheckData = await adminCheckRes.json();
        if (adminCheckData.isAdmin && adminCheckData.member) {
          isConfirmedAdmin = true;
          confirmedAdminMember = adminCheckData.member;
        }
      } catch {
        // API unreachable — fall through
      }

      // ─── Step 2a: Confirmed Admin — unchanged fast-path (do not modify)
      if (isConfirmedAdmin && confirmedAdminMember) {
        const supabase = createClient();

        const { error: signUpError } = await supabase.auth.signUp({
          email: emailCheck.normalizedEmail,
          password,
          options: {
            data: {
              full_name: fullName || confirmedAdminMember.full_name || "",
              role: "admin",
            },
          },
        });

        if (signUpError && !signUpError.message.includes("already registered")) {
          setErrorMessage(signUpError.message || "Failed to create account.");
          setLoading(false);
          return;
        }

        appointNewAdmin({
          email: emailCheck.normalizedEmail,
          fullName: fullName || confirmedAdminMember.full_name || "",
          department: confirmedAdminMember.department || "Executive Council",
          specialty: confirmedAdminMember.specialty || "Administrator",
        });

        await grantAdminSession(emailCheck.normalizedEmail, "admin");
        setSuccessMessage("Admin account created! Opening your portal...");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // ─── Step 2b: Regular member signup — Supabase Auth only.
      // The credential-store (registerAccountCredential) is admin-only and
      // blocks all non-admin signups. We bypass it entirely for regular members.
      const supabase = createClient();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailCheck.normalizedEmail,
        password,
        options: { data: { full_name: fullName } },
      });

      if (signUpError) {
        const msg = signUpError.message || "";
        const low = msg.toLowerCase();
        if (low.includes("already registered") || low.includes("user_already_exists") || low.includes("already been registered")) {
          setErrorMessage("An account with this email already exists. Try signing in instead.");
        } else if (low.includes("weak_password") || low.includes("password should")) {
          setErrorMessage("Password is too weak. Use at least 8 characters with a mix of letters and numbers.");
        } else if (low.includes("rate limit") || low.includes("over_email_send_rate_limit")) {
          setErrorMessage("Too many attempts. Please wait a few minutes and try again.");
        } else if (low.includes("not authorized")) {
          setErrorMessage("This email address is not authorized to sign up.");
        } else {
          setErrorMessage("Could not create your account. Please try again.");
        }
        setLoading(false);
        return;
      }

      if (!signUpData?.user) {
        setErrorMessage("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      if (signUpData.session) {
        // Email confirmation is OFF — user is fully signed in immediately.
        // Set the same cookies the OAuth callback sets for members.
        await grantAdminSession(emailCheck.normalizedEmail, "member");
        setSuccessMessage("Account created! Taking you to your portal...");
        router.push(redirectTo || "/dashboard");
        router.refresh();
      } else {
        // Email confirmation is ON — session is null until user clicks the link.
        setSuccessMessage(
          "Account created! Please check your email inbox and click the confirmation link to activate your account, then come back and sign in."
        );
        setMode("login");
      }

    } catch (err: any) {
      setErrorMessage(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password reset email
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailCheck = validateEmail(forgotEmail.trim().toLowerCase());
    if (!emailCheck.valid) {
      setErrorMessage(emailCheck.error || "Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const siteUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "";

      // Supabase handles non-existent emails gracefully (sends nothing, returns no error)
      await supabase.auth.resetPasswordForEmail(emailCheck.normalizedEmail, {
        redirectTo: `${siteUrl}/reset-password`,
      });
    } catch {
      // Intentionally ignored — always show neutral confirmation
    }

    // Always show neutral message — never reveal whether the email exists
    setSuccessMessage(
      "If an account exists with that email address, a reset link has been sent. Check your inbox and spam folder."
    );
    setForgotEmail("");
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md glass-panel border-white/[0.06] shadow-2xl overflow-hidden relative bg-[#0D0D0D]/90 rounded-3xl">
      {/* Header */}
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full overflow-hidden border border-white/15 shadow-md mb-2 bg-neutral-900">
          <Image
            src="/images/malhar-logo.png"
            alt="MALHAR Society Logo"
            width={64}
            height={64}
            className="object-cover brightness-105"
          />
        </div>
        <div className="relative h-7 w-36 mx-auto mb-1">
          <Image
            src="/images/malhar-wordmark.png"
            alt="MALHAR"
            fill
            className="object-contain brightness-110"
          />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-neutral-100">
          {mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Reset Password"}
        </CardTitle>

        <CardDescription className="text-xs text-neutral-400">
          {mode === "login"
            ? "Enter your email and password to sign in."
            : mode === "register"
            ? "Sign up with your email to get started."
            : "Enter your email and we\u2019ll send you a secure reset link."}
        </CardDescription>

        {/* Tabs — hidden in forgot-password mode */}
        {mode !== "forgot" ? (
          <div className="grid grid-cols-2 gap-1 bg-black p-1 rounded-full border border-white/10 mt-2">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 ${
                mode === "login"
                  ? "bg-neutral-200 text-neutral-950 font-semibold shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 ${
                mode === "register"
                  ? "bg-neutral-200 text-neutral-950 font-semibold shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        ) : (
          <p className="text-[10px] text-neutral-500 mt-2 text-center tracking-wide uppercase font-semibold">Account Recovery</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {mode === "login" ? (
          /* ===================== SIGN IN ===================== */
          <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <Input
                  type="email"
                  name="admin_login_user_email"
                  id="admin_login_user_email"
                  autoComplete="off"
                  placeholder="Enter email"
                  className="pl-9 text-xs bg-black/60 border-white/10 text-neutral-200 placeholder:text-neutral-500"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={loading || googleLoading}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <Input
                  type={showLoginPassword ? "text" : "password"}
                  name="admin_login_user_pass"
                  id="admin_login_user_pass"
                  autoComplete="new-password"
                  className="pl-9 pr-10 text-xs bg-black/60 border-white/10 text-neutral-200"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={loading || googleLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none p-0.5"
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full rounded-full font-semibold py-5 text-xs bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm mt-1"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </Button>

            {/* Forgot password */}
            <div className="text-center -mt-1">
              <button
                type="button"
                onClick={() => { setMode("forgot"); setErrorMessage(null); setSuccessMessage(null); }}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Forgot your password?
              </button>
            </div>

            {/* OR Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0D0D0D] px-3 text-neutral-500 text-[10px] font-semibold tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Sign in with Google Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-full border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-neutral-200 text-xs font-medium shadow-sm transition-all"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-300" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>Sign in with Google</span>
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-xs text-neutral-400 hover:text-neutral-200 font-medium"
              >
                Don&apos;t have an account? Sign Up &rarr;
              </button>
            </div>
          </form>
        ) : mode === "register" ? (
          /* ===================== SIGN UP ===================== */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-neutral-300 mb-1.5 block">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="e.g. Rahul Sharma"
                  className="pl-9 text-xs bg-black/60 border-white/10 text-neutral-200 placeholder:text-neutral-500"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                  disabled={loading || googleLoading}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 mb-1.5 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <Input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  className="pl-9 text-xs bg-black/60 border-white/10 text-neutral-200 placeholder:text-neutral-500"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  disabled={loading || googleLoading}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 mb-1.5 block">
                Password (min 6 chars)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <Input
                  type={showRegPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9 text-xs bg-black/60 border-white/10 text-neutral-200"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading || googleLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
                >
                  {showRegPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 mb-1.5 block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <Input
                  type={showRegConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9 text-xs bg-black/60 border-white/10 text-neutral-200"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading || googleLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
                >
                  {showRegConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full rounded-full font-semibold py-5 text-xs bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm mt-1"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Create Account</span>
                </>
              )}
            </Button>


            {/* OR Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0D0D0D] px-3 text-neutral-500 text-[10px] font-semibold tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Sign in with Google Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-full border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-neutral-200 text-xs font-medium shadow-sm transition-all"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-300" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>Sign up with Google</span>
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs text-neutral-400 hover:text-neutral-200 font-medium"
              >
                Already have an account? Sign In &rarr;
              </button>
            </div>
          </form>
        ) : (
          /* ===================== FORGOT PASSWORD ===================== */
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-neutral-400 leading-relaxed">
              Enter your registered email address and we&apos;ll send you a link to reset your password.
            </p>

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="pl-9 text-xs bg-black/60 border-white/10 text-neutral-200 placeholder:text-neutral-500"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full rounded-full font-semibold py-5 text-xs bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setMode("login"); setErrorMessage(null); setSuccessMessage(null); setForgotEmail(""); }}
                className="text-xs text-neutral-400 hover:text-neutral-200 font-medium transition-colors"
              >
                &larr; Back to Sign In
              </button>
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center border-t border-white/[0.06] pt-3 text-xs text-neutral-500">
        <span>MALHAR Cultural Society</span>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="absolute w-[400px] h-[400px] bg-white/[0.02] blur-[130px] rounded-full pointer-events-none -z-10" />
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    </div>
  );
}
