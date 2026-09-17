"use client";

/**
 * /dashboard — Minimal Member Profile Page
 *
 * This is the landing page for all authenticated (non-admin) users after sign-in.
 * It intentionally shows ONLY:
 *   - Avatar initial circle
 *   - Display name (editable → saves to profiles.full_name)
 *   - Email (read-only)
 *   - Role badge
 *   - UID
 *   - My Tickets (inline expanded list of their event registrations)
 *   - Sign Out
 *
 * Admin users who land here see an additional "Enter Admin Console" banner.
 * Do NOT add stat cards, bulletins panel, upcoming-events panel, or explore grid —
 * those were removed intentionally and belong on the public site pages.
 *
 * Route kept as /dashboard (not /profile) so OAuth callback and login redirects
 * don't need updating.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Ticket,
  Loader2,
  Shield,
  LayoutDashboard,
  ChevronRight,
  Pencil,
  Check,
  X,
  QrCode,
  CheckCircle2,
  Receipt,
  ClipboardList,
  Copy,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";
import { getRoleDisplayName, getRoleBadgeColor } from "@/lib/auth/rbac";

interface UserRegistration {
  id: string;
  event_id: string;
  event_title?: string;
  student_name: string;
  student_email: string;
  created_at?: string;
  status?: string;
}

export default function MemberProfilePage() {
  const { user, role, signOut, loading: authLoading } = useAuth();
  const router = useRouter();

  // Mount guard — prevents hydration flash
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  // Redirect unauthenticated visitors
  React.useEffect(() => {
    if (!mounted) return;
    if (!authLoading && !user) {
      router.replace("/login?redirectTo=/dashboard");
    }
  }, [mounted, authLoading, user, router]);

  // ── Registrations / My Tickets ──────────────────────────────────────────
  const [registrations, setRegistrations] = React.useState<UserRegistration[]>([]);
  const [regLoading, setRegLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user?.email) return;
    setRegLoading(true);
    const supabase = createClient();
    (supabase.from("registrations") as any)
      .select(`id, event_id, student_name, student_email, created_at, status, events (title)`)
      .eq("student_email", user.email.toLowerCase())
      .order("created_at", { ascending: false })
      .then(({ data }: { data: any[] | null }) => {
        if (data) {
          setRegistrations(
            data.map((r: any) => ({
              id: r.id,
              event_id: r.event_id,
              event_title: r.events?.title || "Event",
              student_name: r.student_name,
              student_email: r.student_email,
              created_at: r.created_at,
              status: r.status || "confirmed",
            }))
          );
        }
        setRegLoading(false);
      })
      .catch(() => setRegLoading(false));
  }, [user?.email]);

  // ── Editable display name ────────────────────────────────────────────────
  const [editingName, setEditingName] = React.useState(false);
  const [nameValue, setNameValue] = React.useState("");
  const [nameSaving, setNameSaving] = React.useState(false);
  const [nameError, setNameError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user?.fullName) setNameValue(user.fullName);
  }, [user?.fullName]);

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed.length < 2) {
      setNameError("Name must be at least 2 characters.");
      return;
    }
    if (!user?.id) return;
    setNameSaving(true);
    setNameError(null);
    try {
      const supabase = createClient();
      const { error } = await (supabase.from("profiles") as any)
        .update({ full_name: trimmed })
        .eq("id", user.id);
      if (error) throw error;
      setEditingName(false);
    } catch {
      setNameError("Failed to save. Please try again.");
    } finally {
      setNameSaving(false);
    }
  };

  // ── UID copy ─────────────────────────────────────────────────────────────
  const [copied, setCopied] = React.useState(false);
  const handleCopyUID = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const isAdmin = role === "super_admin" || role === "admin";
  const roleBadge = getRoleBadgeColor(role);
  const roleDisplay = getRoleDisplayName(role).toUpperCase();
  const firstInitial = (user?.fullName || user?.email || "M")[0].toUpperCase();

  // ── Loading / unauthenticated state ─────────────────────────────────────
  if (!mounted || authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── Admin Console Banner ── */}
        {isAdmin && (
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-neutral-200" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-100">Admin Access</p>
                <p className="text-[10px] text-neutral-500">You have administrative privileges on this site.</p>
              </div>
            </div>
            <Button asChild size="sm" className="rounded-full bg-neutral-100 text-neutral-950 hover:bg-white font-semibold text-xs px-4 shrink-0">
              <Link href="/admin/dashboard">
                <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                Console
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Link>
            </Button>
          </div>
        )}

        {/* ── Main Profile Card ── */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A]/90 backdrop-blur-xl overflow-hidden">

          {/* Top: Avatar + Identity */}
          <div className="px-6 pt-8 pb-6 space-y-5">

            {/* Avatar circle */}
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-800 border border-white/10 flex items-center justify-center text-3xl font-extrabold text-white shadow-inner select-none">
                {firstInitial}
              </div>
            </div>

            {/* Name (editable) */}
            <div className="text-center space-y-1">
              {editingName ? (
                <div className="flex items-center justify-center gap-2">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="text-center text-lg font-bold bg-white/[0.04] border-white/10 text-neutral-100 rounded-xl max-w-[200px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") { setEditingName(false); setNameValue(user.fullName || ""); setNameError(null); }
                    }}
                    disabled={nameSaving}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={nameSaving}
                    className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                  >
                    {nameSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" /> : <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNameValue(user.fullName || ""); setNameError(null); }}
                    className="h-8 w-8 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-neutral-400" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-2xl font-extrabold text-neutral-100 tracking-tight">
                    {user.fullName || "Malhar Member"}
                  </h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="h-7 w-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
                    title="Edit display name"
                  >
                    <Pencil className="h-3 w-3 text-neutral-500" />
                  </button>
                </div>
              )}
              {nameError && (
                <p className="text-[11px] text-rose-400 text-center">{nameError}</p>
              )}

              {/* Email */}
              <p className="text-sm text-neutral-500">{user.email}</p>

              {/* Role badge + UID */}
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border tracking-wider ${roleBadge}`}>
                  {roleDisplay}
                </span>
                <button
                  onClick={handleCopyUID}
                  title="Copy full UID"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono text-neutral-500 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  {copied ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>UID: {user.id.slice(0, 8).toUpperCase()}…</span>
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* My Tickets section */}
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <Ticket className="h-4 w-4 text-neutral-400" />
              <h2 className="text-sm font-bold text-neutral-100">My Tickets</h2>
              {registrations.length > 0 && (
                <span className="ml-auto text-[10px] font-mono text-neutral-500 border border-white/[0.08] px-2 py-0.5 rounded-full">
                  {registrations.length}
                </span>
              )}
            </div>

            {regLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-600" />
              </div>
            ) : registrations.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-3 text-center">
                <div className="h-11 w-11 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-neutral-700" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400 font-medium">No tickets yet</p>
                  <p className="text-xs text-neutral-600 mt-0.5">Register for an event to see your pass here.</p>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-full border-white/10 text-xs">
                  <Link href="/events">Browse Events</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <QrCode className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-100 truncate">{reg.event_title}</p>
                        {reg.created_at && (
                          <p className="text-[10px] text-neutral-600">
                            {new Date(reg.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        reg.status === "confirmed" || !reg.status
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {reg.status === "confirmed" || !reg.status ? "Confirmed" : reg.status}
                      </span>
                      <div className="flex items-center gap-1">
                        <Receipt className="h-3 w-3 text-neutral-600" />
                        <span className="text-[9px] text-neutral-600 font-mono">#{reg.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* Sign Out */}
          <div className="px-6 py-5">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] hover:bg-rose-500/[0.08] text-rose-400 transition-all group"
            >
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <LogOut className="h-4 w-4 text-rose-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-rose-400">Sign Out</p>
                <p className="text-[10px] text-rose-500/70">Log out of your account</p>
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
