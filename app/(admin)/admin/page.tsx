"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  Sparkles,
  Clock,
  CheckCircle2,
  Bell,
  ArrowRight,
  Shield,
  Layers,
  UserPlus,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { useToast } from "@/components/ui/toast";
import { CreateEventDialog } from "@/components/admin/event-dialogs";
import { AddMemberDialog } from "@/components/admin/member-dialogs";
import { DraftNoticeDialog } from "@/components/admin/notice-dialogs";

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    events,
    members,
    departments,
    announcements,
    registrations,
    stats,
    updateStats,
    createEvent,
    createMember,
    postAnnouncement,
  } = useAdminData();
  const { toast } = useToast();

  const [createEventOpen, setCreateEventOpen] = React.useState(false);
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [postNoticeOpen, setPostNoticeOpen] = React.useState(false);
  const [isEditingStats, setIsEditingStats] = React.useState(false);
  const [editActiveMembers, setEditActiveMembers] = React.useState(stats?.activeMembers !== undefined ? stats.activeMembers : 7);
  const [editEventsOrganised, setEditEventsOrganised] = React.useState(stats?.eventsOrganised !== undefined ? stats.eventsOrganised : 8);

  React.useEffect(() => {
    if (stats) {
      if (stats.activeMembers !== undefined) setEditActiveMembers(stats.activeMembers);
      if (stats.eventsOrganised !== undefined) setEditEventsOrganised(stats.eventsOrganised);
    }
  }, [stats?.activeMembers, stats?.eventsOrganised]);

  const handleSave = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await (supabase.from("site_settings") as any).upsert([
        { key: "public_active_members", value: String(editActiveMembers) },
        { key: "public_events_organised", value: String(editEventsOrganised) }
      ], { onConflict: "key" });

      await (supabase.from("club_stats") as any).upsert({
        id: "current",
        active_members: Number(editActiveMembers),
        events_organised: Number(editEventsOrganised),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    } catch (e) {
      console.warn("Direct Supabase write error:", e);
    }

    try {
      const { updateClubStatsAction } = await import("@/lib/actions/stats");
      await updateClubStatsAction({
        activeMembers: Number(editActiveMembers),
        eventsOrganised: Number(editEventsOrganised),
      });
    } catch (_) {}

    setIsEditingStats(false);
    router.refresh();
    toast({
      title: "Public Stats Updated",
      description: `Active Members (${editActiveMembers}+) & Events Organised (${editEventsOrganised}+) saved directly to site_settings.`,
      type: "success",
    });
  };

  const totalRegistrations = registrations.length + events.reduce((acc, ev) => acc + (ev.registered_count || 0), 0);

  return (
    <div className="space-y-8">
      {/* Top Header & Floating Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-medium mb-2">
            <Shield className="h-3.5 w-3.5 text-neutral-400" /> MALHAR Administrative Console
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-100">
            Executive <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Real-time analytics, dynamic stats synchronization, and event registration tracking.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="default"
            size="sm"
            onClick={() => setCreateEventOpen(true)}
            className="flex items-center gap-1.5 shadow-sm rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Event</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPostNoticeOpen(true)}
            className="border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07] rounded-full"
          >
            <Bell className="mr-1.5 h-4 w-4 text-neutral-400" />
            <span>Post Announcement</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddMemberOpen(true)}
            className="border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07] rounded-full"
          >
            <UserPlus className="mr-1.5 h-4 w-4 text-neutral-400" />
            <span>Add Member</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Stats Live Management Banner */}
      <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 p-6 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Public Live Stats Sync</span>
              <Badge variant="upcoming" className="text-[10px]">Real-Time Synced</Badge>
            </div>
            <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
              The main website displays only two official dynamic numbers. As Admin/Super Admin, you can edit them directly below to update the public website in real time.
            </p>
          </div>

          {!isEditingStats ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-4 px-4 py-2.5 bg-black/60 rounded-2xl border border-white/10">
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">Active Members</div>
                  <div className="text-lg font-bold text-neutral-100 font-mono">
                    {stats?.activeMembers !== undefined ? stats.activeMembers : 7}+
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider">Events Organised</div>
                  <div className="text-lg font-bold text-neutral-100 font-mono">
                    {stats?.eventsOrganised !== undefined ? stats.eventsOrganised : 8}+
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingStats(true)}
                className="border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07] rounded-full font-medium"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
                <span>Edit Public Numbers</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 p-3.5 bg-black/80 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-neutral-300 font-medium whitespace-nowrap">Active Members:</label>
                <Input
                  type="number"
                  value={editActiveMembers}
                  onChange={(e) => setEditActiveMembers(Number(e.target.value))}
                  className="w-24 h-8 text-xs font-mono font-bold bg-neutral-900 border-white/10 text-neutral-100 rounded-xl"
                  min={0}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] text-neutral-300 font-medium whitespace-nowrap">Events Organised:</label>
                <Input
                  type="number"
                  value={editEventsOrganised}
                  onChange={(e) => setEditEventsOrganised(Number(e.target.value))}
                  className="w-24 h-8 text-xs font-mono font-bold bg-neutral-900 border-white/10 text-neutral-100 rounded-xl"
                  min={0}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setEditActiveMembers(members.length);
                    setEditEventsOrganised(events.length);
                  }}
                  className="h-8 rounded-full text-[11px] border-white/10 text-neutral-300 hover:text-white"
                  title="Use exact database count"
                >
                  Use Roster ({members.length})
                </Button>
                <Button size="sm" variant="default" onClick={handleSave} className="h-8 rounded-full text-xs font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]">
                  Save & Publish
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingStats(false)} className="h-8 text-xs text-neutral-400 rounded-full">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

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
              {events.filter((e) => e.status === "upcoming").length} upcoming showcases
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

      {/* Main Grid: Event Capacity Utilization & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Event Capacity Utilization Bars */}
        <Card className="lg:col-span-2 glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-neutral-100">Event Capacity & Registration Tracking</CardTitle>
              <CardDescription className="text-xs text-neutral-400">Real-time attendance and seat quota distribution</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/admin/events" className="text-xs text-neutral-300 hover:text-white flex items-center gap-1">
                <span>All Events</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {events.slice(0, 5).map((ev) => {
              const registered = ev.registered_count || 0;
              const maxCap = ev.max_capacity || 300;
              const percent = Math.min(100, Math.round((registered / maxCap) * 100));
              return (
                <div key={ev.id} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-neutral-200">{ev.title}</span>
                        <Badge variant="member" className="text-[10px]">{ev.category}</Badge>
                      </div>
                      <span className="text-[11px] text-neutral-400">Venue: {ev.venue}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-neutral-200">
                        {registered} / {maxCap} Slots
                      </span>
                      <span className="block text-[10px] text-neutral-400">{percent}% Filled</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent >= 90
                          ? "bg-rose-500"
                          : "bg-[#E5E5E5]"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
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
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
              <Sparkles className="h-4 w-4 text-neutral-400" /> Society Identification
            </div>
            <div className="space-y-2 text-xs text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-400">Society:</span>
                <span className="text-neutral-200 font-semibold">MALHAR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Institution:</span>
                <span className="text-neutral-300 font-medium">Mirai School of Tech</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Batch:</span>
                <span className="text-neutral-300 font-medium">2025–29</span>
              </div>
            </div>
          </Card>
        </div>
      </div>


      {/* Dialog Modals */}
      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onCreate={async (ev) => {
          await createEvent(ev);
          toast({ title: "Event Created", description: `"${ev.title}" is now published.` });
        }}
      />

      <AddMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onAdd={async (m) => {
          await createMember(m);
          toast({ title: "Member Enrolled", description: `${m.full_name} has been added to ${m.department}.` });
        }}
      />

      <DraftNoticeDialog
        open={postNoticeOpen}
        onOpenChange={setPostNoticeOpen}
        onPost={async (title, content, priority, isEmergency) => {
          await postAnnouncement(title, content, priority, isEmergency);
          toast({
            title: isEmergency ? "Emergency Notice Broadcasted" : "Notice Published",
            description: title,
            type: isEmergency ? "warning" : "success",
          });
        }}
      />
    </div>
  );
}
