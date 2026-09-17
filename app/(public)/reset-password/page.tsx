"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  // Supabase puts the recovery session tokens in the URL hash (#access_token=...&type=recovery).
  // The Supabase client SDK picks them up automatically on mount via onAuthStateChange.
  // We just need to wait for the SIGNED_IN / PASSWORD_RECOVERY event before calling updateUser.
  const [sessionReady, setSessionReady] = React.useState(false);
  const [sessionError, setSessionError] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();

    // Listen for the PASSWORD_RECOVERY event Supabase fires when the recovery
    // link is opened — this confirms the session is ready.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          setSessionReady(true);
        }
        if (event === "SIGNED_IN" && session) {
          // Some Supabase versions fire SIGNED_IN instead of PASSWORD_RECOVERY
          setSessionReady(true);
        }
      }
    );

    // Also try getSession in case the event already fired before this effect ran
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        // No session and no hash — this page was opened without a valid reset link
        // Give it 2 s for the hash-exchange to complete before showing an error
        setTimeout(() => {
          setSessionReady((current) => {
            if (!current) setSessionError(true);
            return current;
          });
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("same password") || msg.includes("different from the old")) {
          setErrorMessage("New password must be different from your current password.");
        } else if (msg.includes("weak_password") || msg.includes("password should")) {
          setErrorMessage("Password is too weak. Use at least 8 characters with a mix of letters and numbers.");
        } else {
          setErrorMessage("Failed to update password. The reset link may have expired — request a new one.");
        }
        return;
      }

      // Sign out so the user starts fresh from the login page
      await supabase.auth.signOut();
      setDone(true);

      // Redirect to login after 2 s
      setTimeout(() => {
        router.push("/login?message=password_reset");
      }, 2000);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md glass-panel border-white/[0.06] shadow-2xl overflow-hidden relative bg-[#0D0D0D]/90 rounded-3xl">
      {/* Header */}
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full overflow-hidden border border-white/15 shadow-md mb-2 bg-neutral-900">
          <Image
            src="/images/malhar-logo.webp"
            alt="MALHAR Society Logo"
            width={64}
            height={64}
            className="object-cover brightness-105"
          />
        </div>
        <div className="relative h-7 w-36 mx-auto mb-1">
          <Image
            src="/images/malhar-wordmark.webp"
            alt="MALHAR"
            fill
            className="object-contain brightness-110"
          />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-neutral-100">
          Set New Password
        </CardTitle>
        <CardDescription className="text-xs text-neutral-400">
          Choose a new password for your MALHAR account.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Success state */}
        {done && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-neutral-100">Password updated!</p>
            <p className="text-xs text-neutral-400">Redirecting you to sign in…</p>
          </div>
        )}

        {/* Invalid link state */}
        {!done && sessionError && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <span>
                This reset link is invalid or has expired. Password reset links can only
                be used once and expire after 1 hour.
              </span>
            </div>
            <Link
              href="/login"
              className="block w-full text-center rounded-full py-2.5 text-xs font-semibold bg-neutral-200 text-neutral-950 hover:bg-neutral-300 transition-all"
            >
              Request a new reset link
            </Link>
          </div>
        )}

        {/* Loading — waiting for recovery session */}
        {!done && !sessionError && !sessionReady && (
          <div className="flex items-center justify-center py-8 gap-3 text-neutral-400 text-xs">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Verifying reset link…</span>
          </div>
        )}

        {/* Password form — only shown when session is confirmed */}
        {!done && !sessionError && sessionReady && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                New Password (min 8 chars)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9 text-xs bg-black/60 border-white/10 text-neutral-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9 text-xs bg-black/60 border-white/10 text-neutral-200"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full rounded-full font-semibold py-5 text-xs bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm mt-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Updating Password…</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </Button>

            <div className="text-center pt-1">
              <Link
                href="/login"
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Cancel — back to Sign In
              </Link>
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

export default function ResetPasswordPage() {
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
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
