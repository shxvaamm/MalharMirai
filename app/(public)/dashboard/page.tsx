"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Sparkles,
  Bell,
  User,
  Shield,
  ArrowRight,
  LogOut,
  BookOpen,
  Users,
  Compass,
  CheckCircle2,
  Ticket,
  Receipt,
  QrCode,
  Lock,
  Loader2,
  LayoutDashboard,
  Crown,
  Mail,
  Building2,
  BadgeCheck,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useEvents } from "@/lib/hooks/use-events";
import { useAnnouncements } from "@/lib/hooks/use-announcements";
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

export default function MemberDashboardPage() {
  const { user, role, signOut, loading: authLoading } = useAuth();
  const { events } = useEvents();
  const { announcements } = useAnnouncements();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [registrations, setRegistrations] = React.useState<UserRegistration[]>([]);
  const [regLoading, setRegLoading] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!mounted) return;
    if (!authLoading && !user) {
      router.replace("/login?redirectTo=/dashboard");
    }
  }, [mounted, authLoading, user, router]);

  // Fetch registrations for the current user
  React.useEffect(() => {
    if (!user?.email) return;
    setRegLoading(true);
    const supabase = createClient();

    (supabase.from("registrations") as any)
      .select(`
        id,
        event_id,
        student_name,
        student_email,
        created_at,
        status,
        events (title)
      `)
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

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const isAdmin = role === "super_admin" || role === "admin";
  const upcomingEvents = events.slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 2);

  // Loading / unauthenticated state
  if (!mounted || authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          <p className="text-xs text-neutral-500">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const roleBadge = getRoleBadgeColor(role);
  const roleDisplay = getRoleDisplayName(role);
  const initials = user.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-black text-neutral-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Admin Console Banner (admins/super admins only) ── */}
        {isAdmin && (
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.10] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-5 sm:p-6 backdrop-blur-xl">
            {/* Subtle radial glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.04] blur-3xl" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-neutral-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-neutral-100">Admin Access Detected</h2>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${roleBadge}`}>
                      <Crown className="h-2.5 w-2.5" />
                      {roleDisplay}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    You have administrative privileges. Switch to the Management Console to manage the society.
                  </p>
                </div>
              </div>
              <Button
                asChild
                size="sm"
                className="rounded-full bg-neutral-100 text-neutral-950 hover:bg-white font-semibold text-xs px-5 py-5 shadow-md shrink-0 transition-all hover:shadow-white/10 hover:shadow-lg"
              >
                <Link href="/admin/dashboard">
                  <LayoutDashboard className="h-3.5 w-3.5 mr-2" />
                  Enter Admin Console
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* ── Profile Header Card ── */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                {user.avatarUrl ? (
                  <div className="h-16 w-16 rounded-2xl overflow-hidden border border-white/10 shadow-md">
                    <Image src={user.avatarUrl} alt={user.fullName} fill className="object-cover" sizes="64px" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-neutral-700 to-neutral-900 border border-white/10 flex items-center justify-center text-xl font-bold text-neutral-100 shadow-inner select-none">
                    {initials}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
                  <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {user.fullName || "Malhar Member"}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${roleBadge}`}>
                    <BadgeCheck className="h-3 w-3" />
                    {roleDisplay}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-xs text-neutral-400 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </p>
                  {user.department && user.department !== "General" && (
                    <p className="text-xs text-neutral-400 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {user.department}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="rounded-full border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-neutral-300 text-xs px-4 py-5 w-full sm:w-auto"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 font-medium">Events</p>
              <p className="text-xl font-bold text-white">{events.length}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Ticket className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 font-medium">My Registrations</p>
              <p className="text-xl font-bold text-white">{registrations.length}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 font-medium">Bulletins</p>
              <p className="text-xl font-bold text-white">{announcements.length}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 font-medium">Status</p>
              <p className="text-sm font-bold text-emerald-400">Active</p>
            </div>
          </div>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* My Registrations / Tickets / Passes */}
          <div className="lg:col-span-2 rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <Ticket className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">My Tickets & Passes</h2>
                  <p className="text-[10px] text-neutral-500">Your event registrations & entry passes</p>
                </div>
              </div>
              <Link
                href="/events"
                className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                Browse Events <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {regLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
              </div>
            ) : registrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-400 font-medium">No registrations yet</p>
                  <p className="text-xs text-neutral-600 mt-1">
                    Register for events to see your tickets and passes here.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-full border-white/10 text-xs mt-1">
                  <Link href="/events">Explore Events</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <QrCode className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-100">{reg.event_title}</h3>
                          <p className="text-[10px] text-neutral-500 mt-0.5">
                            Registered as: {reg.student_name}
                          </p>
                          {reg.created_at && (
                            <p className="text-[10px] text-neutral-600">
                              {new Date(reg.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold
                          ${reg.status === "confirmed" || !reg.status
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : reg.status === "pending"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20"
                          }`}>
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {reg.status === "confirmed" || !reg.status ? "Confirmed" : reg.status}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Receipt className="h-3 w-3 text-neutral-500" />
                          <span className="text-[9px] text-neutral-600 font-mono">#{reg.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Announcements + Upcoming Events */}
          <div className="space-y-5">
            {/* Latest Announcements */}
            <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-neutral-400" />
                  <h2 className="text-sm font-bold text-white">Latest Bulletins</h2>
                </div>
                <Link
                  href="/announcements"
                  className="text-[10px] font-semibold text-neutral-500 hover:text-white transition-colors"
                >
                  View all →
                </Link>
              </div>

              <div className="space-y-2.5">
                {recentAnnouncements.length === 0 ? (
                  <p className="text-xs text-neutral-600 py-4 text-center">No announcements yet.</p>
                ) : (
                  recentAnnouncements.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-semibold text-neutral-200 line-clamp-1">{item.title}</h3>
                        <span className="text-[9px] text-neutral-600 uppercase tracking-wider font-semibold shrink-0">
                          {item.priority || "Update"}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 line-clamp-2">{item.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <h2 className="text-sm font-bold text-white">Upcoming Events</h2>
                </div>
                <Link
                  href="/events"
                  className="text-[10px] font-semibold text-neutral-500 hover:text-white transition-colors"
                >
                  View all →
                </Link>
              </div>

              <div className="space-y-2.5">
                {upcomingEvents.length === 0 ? (
                  <p className="text-xs text-neutral-600 py-4 text-center">No events scheduled.</p>
                ) : (
                  upcomingEvents.map((evt) => (
                    <Link
                      key={evt.id}
                      href={`/events/${evt.id}`}
                      className="block p-3.5 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] transition-all"
                    >
                      <h3 className="text-xs font-semibold text-neutral-200 line-clamp-1">{evt.title}</h3>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        {evt.venue || "Campus Auditorium"}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Navigation ── */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3 pl-1">Explore</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/events", icon: Compass, label: "Events" },
              { href: "/gallery", icon: Sparkles, label: "Gallery" },
              { href: "/leadership", icon: Crown, label: "Core Team" },
              { href: "/about", icon: BookOpen, label: "About" },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all group text-center space-y-2"
              >
                <Icon className="h-5 w-5 mx-auto text-neutral-500 group-hover:text-neutral-200 transition-colors" />
                <p className="text-xs font-semibold text-neutral-400 group-hover:text-neutral-200 transition-colors">{label}</p>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
