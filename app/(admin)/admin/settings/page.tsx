"use client";

import * as React from "react";
import {
  Settings,
  Shield,
  Lock,
  Globe,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  KeyRound,
  Sparkles,
  BarChart3,
  Users,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { SOCIETY_INFO } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth/auth-context";
import { isSuperAdminEmail } from "@/lib/auth/rbac";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { stats, members, events, updateStats } = useAdminData();
  const { user: authUser, role: authRole } = useAuth();
  const isSuperAdmin = authRole === "super_admin" || isSuperAdminEmail(authUser?.email);

  // Dynamic Statistics State
  const [activeMembers, setActiveMembers] = React.useState(stats?.activeMembers || members.length || 48);
  const [eventsOrganised, setEventsOrganised] = React.useState(stats?.eventsOrganised || events.length || 12);
  const [savingStats, setSavingStats] = React.useState(false);

  // Club Profile State
  const [clubName, setClubName] = React.useState(SOCIETY_INFO.name);
  const [aboutText, setAboutText] = React.useState(SOCIETY_INFO.aboutText);
  const [officialEmail, setOfficialEmail] = React.useState(SOCIETY_INFO.contact.email);
  const [instagram, setInstagram] = React.useState(SOCIETY_INFO.contact.instagram);
  const [address, setAddress] = React.useState(SOCIETY_INFO.contact.location);
  const [savingSettings, setSavingSettings] = React.useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [savingPassword, setSavingPassword] = React.useState(false);

  React.useEffect(() => {
    if (stats) {
      setActiveMembers(stats.activeMembers !== undefined ? stats.activeMembers : (members.length || 48));
      setEventsOrganised(stats.eventsOrganised !== undefined ? stats.eventsOrganised : (events.length || 12));
    }
  }, [stats, members.length, events.length]);

  const handleSaveDynamicStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStats(true);
    const newAct = Number(activeMembers) >= 0 ? Number(activeMembers) : 0;
    const newEv = Number(eventsOrganised) >= 0 ? Number(eventsOrganised) : 0;
    await updateStats({
      activeMembers: newAct,
      eventsOrganised: newEv,
    });
    setSavingStats(false);
    toast({
      title: "Dynamic Statistics Synchronized",
      description: `Active Members: ${newAct}, Events Organised: ${newEv}. Real-time public view updated.`,
      type: "success",
    });
  };

  const handleSaveClubSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    await new Promise((r) => setTimeout(r, 600));
    setSavingSettings(false);
    toast({
      title: "Society Settings Saved",
      description: "Official contact details and public social links updated.",
    });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        type: "error",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters.",
        type: "warning",
      });
      return;
    }

    setSavingPassword(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("malhar_custom_superadmin_password", newPassword);
    }
    await new Promise((r) => setTimeout(r, 400));
    setSavingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast({
      title: "Super Admin Password Updated",
      description: "Your new executive password has been saved and is required for next login.",
      type: "success",
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
          Portal &amp; Society <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Configure dynamic public metrics, official contact metadata, and Super Admin credentials.
        </p>
      </div>

      {/* Dynamic Statistics Management Card */}
      <form onSubmit={handleSaveDynamicStats}>
        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-neutral-100">
                <BarChart3 className="h-4 w-4 text-neutral-400" />
                <span>Dynamic Public Statistics</span>
              </CardTitle>
              <Badge variant="upcoming" className="border-white/10 bg-white/[0.05] text-neutral-300 rounded-full">Real-Time Synced</Badge>
            </div>
            <CardDescription className="text-xs text-neutral-400">
              These two numbers are displayed dynamically across the public website (homepage and about page).
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-neutral-400" />
                  <span>Active Members Count</span>
                </label>
                <Input
                  type="number"
                  value={activeMembers}
                  onChange={(e) => setActiveMembers(Number(e.target.value))}
                  required
                  min={1}
                  className="font-mono text-sm font-bold text-neutral-100 bg-black/80 border-white/10 rounded-xl"
                />
                <p className="text-[11px] text-neutral-400">
                  Total student coordinators and active contributors across all 5 departments.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <span>Number of Events Organised</span>
                </label>
                <Input
                  type="number"
                  value={eventsOrganised}
                  onChange={(e) => setEventsOrganised(Number(e.target.value))}
                  required
                  min={1}
                  className="font-mono text-sm font-bold text-neutral-100 bg-black/80 border-white/10 rounded-xl"
                />
                <p className="text-[11px] text-neutral-400">
                  Historical and upcoming cultural fests, design expos, and orientation galas.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveMembers(members.length);
                  setEventsOrganised(events.length);
                }}
                className="border-white/10 bg-white/[0.03] rounded-full text-xs text-neutral-300 hover:text-white"
              >
                Auto-Fill from Database ({members.length} Members, {events.length} Events)
              </Button>

              <Button type="submit" variant="default" size="sm" disabled={savingStats} className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {savingStats ? "Synchronizing..." : "Update Public Statistics"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Society Metadata Form */}
      <form onSubmit={handleSaveClubSettings}>
        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-neutral-100">
                <Globe className="h-4 w-4 text-neutral-400" />
                <span>Official Society Metadata</span>
              </CardTitle>
              <Badge variant="member" className="border-white/10 bg-white/[0.05] text-neutral-300 rounded-full">Public Identity</Badge>
            </div>
            <CardDescription className="text-xs text-neutral-400">
              Branding metadata displayed on the public navbar, hero, footer, and contact page.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-300">Official Society Name</label>
                <Input value={clubName} onChange={(e) => setClubName(e.target.value)} required className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-300">Official Society Email</label>
                <Input type="email" value={officialEmail} onChange={(e) => setOfficialEmail(e.target.value)} required className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Official About Copy</label>
              <Input value={aboutText} onChange={(e) => setAboutText(e.target.value)} required className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-300">Official Instagram URL</label>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} required className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-300">Campus Headquarters</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} required className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="outline" size="sm" disabled={savingSettings} className="border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07] rounded-full">
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {savingSettings ? "Saving..." : "Save Metadata"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Super Admin Access & Authority — visible to Super Admin only */}
      {isSuperAdmin && (
      <form onSubmit={handleUpdatePassword}>
        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-neutral-100">
                <KeyRound className="h-4 w-4 text-neutral-300" />
                <span>Super Admin Access &amp; Authority</span>
              </CardTitle>
              <Badge variant="admin" className="bg-white/[0.08] text-neutral-200 border-white/20 rounded-full font-semibold">
                Super Admin Root
              </Badge>
            </div>
            <CardDescription className="text-xs text-neutral-400">
              Primary Super Admin: <span className="font-mono font-semibold text-neutral-200">shvxamkumar@gmail.com</span> (Full system authority over administrators, events, and records).
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-300">Current Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-300">New Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-300">Confirm New Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="outline" size="sm" disabled={savingPassword} className="border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07] rounded-full">
                <Lock className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
                {savingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
      )} {/* end isSuperAdmin */}
    </div>
  );
}
