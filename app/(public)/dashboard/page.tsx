"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Sparkles,
  Bell,
  User,
  Shield,
  ArrowRight,
  LogOut,
  ExternalLink,
  Award,
  BookOpen,
  Users,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useEvents } from "@/lib/hooks/use-events";
import { useAnnouncements } from "@/lib/hooks/use-announcements";

export default function MemberDashboardPage() {
  const { user, role, signOut, loading: authLoading } = useAuth();
  const { events } = useEvents();
  const { announcements } = useAnnouncements();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const isAdmin = role === "super_admin" || role === "admin";
  const upcomingEvents = events.slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 3);

  return (
    <div className="min-h-screen bg-black text-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xl font-bold text-neutral-200 shadow-inner">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="h-8 w-8 text-neutral-400" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Welcome back, {user?.fullName || "Malhar Member"}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Member
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400">
                  {user?.email || "Authenticated via Google OAuth"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isAdmin && (
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-semibold px-5 py-5"
                >
                  <Link href="/admin/dashboard">
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    Admin Console
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="rounded-full border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-neutral-300 text-xs px-4 py-5"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium">Upcoming Events</p>
              <p className="text-2xl font-bold text-white">{events.length}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium">Society Bulletins</p>
              <p className="text-2xl font-bold text-white">{announcements.length}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium">Membership Role</p>
              <p className="text-lg font-bold text-white capitalize">{role || "Member"}</p>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Society Events */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <h2 className="text-base font-bold text-white">Upcoming Events</h2>
              </div>
              <Link
                href="/events"
                className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-neutral-500 py-6 text-center">No upcoming events listed yet.</p>
              ) : (
                upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-neutral-100">{evt.title}</h3>
                      <p className="text-xs text-neutral-400">
                        {evt.date_time} • {evt.venue || "Campus Auditorium"}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="ghost" className="text-xs text-neutral-300 hover:text-white">
                      <Link href={`/events/${evt.id}`}>Details</Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Society Announcements & Updates */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-neutral-400" />
                <h2 className="text-base font-bold text-white">Society Bulletins</h2>
              </div>
              <Link
                href="/announcements"
                className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentAnnouncements.length === 0 ? (
                <p className="text-xs text-neutral-500 py-6 text-center">No announcements published yet.</p>
              ) : (
                recentAnnouncements.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-neutral-100">{item.title}</h3>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                        {item.priority || "Update"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2">{item.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/events"
            className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all group space-y-2 text-center"
          >
            <Compass className="h-5 w-5 mx-auto text-neutral-400 group-hover:text-white transition-colors" />
            <p className="text-xs font-semibold text-neutral-200">Explore Events</p>
          </Link>

          <Link
            href="/gallery"
            className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all group space-y-2 text-center"
          >
            <Sparkles className="h-5 w-5 mx-auto text-neutral-400 group-hover:text-white transition-colors" />
            <p className="text-xs font-semibold text-neutral-200">Media Gallery</p>
          </Link>

          <Link
            href="/leadership"
            className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all group space-y-2 text-center"
          >
            <Users className="h-5 w-5 mx-auto text-neutral-400 group-hover:text-white transition-colors" />
            <p className="text-xs font-semibold text-neutral-200">Club Council</p>
          </Link>

          <Link
            href="/about"
            className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all group space-y-2 text-center"
          >
            <BookOpen className="h-5 w-5 mx-auto text-neutral-400 group-hover:text-white transition-colors" />
            <p className="text-xs font-semibold text-neutral-200">About Malhar</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
