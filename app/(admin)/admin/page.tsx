"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  ClipboardList,
  TrendingUp,
  Sparkles,
  Bell,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { getEffectiveEventStatus } from "@/lib/utils";

export default function AdminDashboardPage() {
  const {
    events,
    departments,
    announcements,
    registrations,
    societyInfo,
  } = useAdminData();

  const totalCapacity = events.reduce((acc, ev) => acc + (ev.max_capacity || 300), 0);
  const totalRegistrations = registrations.length;
  const overallUtilization = totalCapacity > 0 ? Math.min(100, Math.round((totalRegistrations / totalCapacity) * 100)) : 0;
  const activeEventsCount = events.filter((e) => getEffectiveEventStatus(e) === "upcoming").length;
  const fullCapacityEventsCount = events.filter((e) => {
    const liveEventRegs = registrations.filter((r) => r.event_id === e.id).length;
    return liveEventRegs >= (e.max_capacity || 300);
  }).length;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-medium mb-2">
          <Shield className="h-3.5 w-3.5 text-neutral-400" /> MALHAR Administrative Console
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-100">
          Executive <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Dashboard</span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Real-time analytics, event registration tracking, and society operations.
        </p>
      </div>

      {/* Analytics KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl p-5 shadow-xl hover:border-white/15 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Live Registrations
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <div className="text-2xl sm:text-3xl font-bold text-neutral-100 font-mono">
              {totalRegistrations.toLocaleString()}
            </div>
            <p className="text-[11px] text-neutral-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 inline text-neutral-400" /> Dynamic slot updates
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl p-5 shadow-xl hover:border-white/15 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Scheduled Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <div className="text-2xl sm:text-3xl font-bold text-neutral-100 font-mono">
              {events.length}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              {events.filter((e) => getEffectiveEventStatus(e) === "upcoming").length} upcoming showcases
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl p-5 shadow-xl hover:border-white/15 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Departments
            </CardTitle>
            <Layers className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <div className="text-2xl sm:text-3xl font-bold text-neutral-100 font-mono">
              {departments.length}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Media, Design, Mgmt, Tech, PR
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl p-5 shadow-xl hover:border-white/15 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Announcements
            </CardTitle>
            <Bell className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <div className="text-2xl sm:text-3xl font-bold text-neutral-100 font-mono">
              {announcements.length}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              {announcements.filter((a) => a.is_emergency).length > 0 ? "1 Emergency Broadcast" : "Standard notices"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Registration Overview & Bulletins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Concise Registration Overview Summary */}
        <Card className="lg:col-span-2 glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-bold text-neutral-100">Registration Overview</CardTitle>
                <Badge variant="member" className="text-[10px]">Read-Only Summary</Badge>
              </div>
              <CardDescription className="text-xs text-neutral-400">
                Consolidated attendance, seat utilization, and quota metrics across events
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white hover:bg-white/[0.07] rounded-full text-xs font-medium">
              <Link href="/admin/registrations" className="flex items-center gap-1.5">
                <span>View Full Ledger</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {/* Aggregate Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">Confirmed Registrations</div>
                <div className="text-2xl font-bold text-neutral-100 font-mono mt-1">
                  {totalRegistrations.toLocaleString()}
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">Verified attendee records</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">Total Allocated Quota</div>
                <div className="text-2xl font-bold text-neutral-100 font-mono mt-1">
                  {totalCapacity.toLocaleString()}
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">Across {events.length} campus showcases</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">Overall Utilization</div>
                <div className="text-2xl font-bold text-neutral-100 font-mono mt-1">
                  {overallUtilization}%
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {fullCapacityEventsCount > 0 ? `${fullCapacityEventsCount} event(s) at capacity` : "Seats available"}
                </p>
              </div>
            </div>

            {/* Capacity Progress Bar & Canonical Link Note */}
            <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-neutral-400" />
                  Campus-Wide Seat Fill Rate
                </span>
                <span className="font-mono text-neutral-200 font-semibold">
                  {totalRegistrations} / {totalCapacity} Seats ({overallUtilization}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overallUtilization >= 90 ? "bg-rose-500" : "bg-[#E5E5E5]"
                  }`}
                  style={{ width: `${overallUtilization}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
                <span>{activeEventsCount} upcoming events accepting entries</span>
                <Link href="/admin/registrations" className="text-neutral-300 hover:text-white underline underline-offset-2">
                  Full attendee records &amp; CSV export &rarr;
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Col: Recent Bulletin & Quick Actions */}
        <div className="space-y-6">
          <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold text-neutral-100">Active Notices</CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-neutral-400 hover:text-neutral-200 rounded-full">
                <Link href="/admin/communication">All Notices &rarr;</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {announcements.slice(0, 3).map((notice) => (
                <div
                  key={notice.id}
                  className={`p-3 rounded-2xl border space-y-1 ${
                    notice.is_emergency
                      ? "bg-rose-950/20 border-rose-500/30"
                      : notice.priority === "urgent"
                      ? "bg-white/[0.04] border-white/10"
                      : "bg-white/[0.02] border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={notice.is_emergency ? "destructive" : notice.priority === "urgent" ? "urgent" : "secondary"}
                      className="text-[9px]"
                    >
                      {notice.is_emergency ? "Emergency" : notice.priority}
                    </Badge>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(notice.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-200 line-clamp-1">{notice.title}</h4>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{notice.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                <Sparkles className="h-4 w-4 text-neutral-400" /> Society Identification
              </div>
              <Badge variant="member" className="text-[9px]">Read-Only</Badge>
            </div>
            <div className="space-y-2 text-xs text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-400">Society:</span>
                <span className="text-neutral-200 font-semibold">{societyInfo?.shortName || societyInfo?.name || "MALHAR"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Institution:</span>
                <span className="text-neutral-300 font-medium">{societyInfo?.college || "Mirai School of Technology"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Batch:</span>
                <span className="text-neutral-300 font-medium">{societyInfo?.batch || "2025–29"}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>


    </div>
  );
}
