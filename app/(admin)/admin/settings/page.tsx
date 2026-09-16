"use client";

import * as React from "react";
import {
  Lock,
  Globe,
  Save,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { useAuth } from "@/lib/auth/auth-context";
import { isSuperAdminEmail } from "@/lib/auth/rbac";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { societyInfo, updateSocietyInfo } = useAdminData();
  const { user: authUser, role: authRole } = useAuth();
  const isSuperAdmin = authRole === "super_admin" || isSuperAdminEmail(authUser?.email);

  // Club Profile State (Sourced from canonical shared societyInfo)
  const [clubName, setClubName] = React.useState(societyInfo.name);
  const [college, setCollege] = React.useState(societyInfo.college || "Mirai School of Technology");
  const [batch, setBatch] = React.useState(societyInfo.batch || "2025–29");
  const [aboutText, setAboutText] = React.useState(societyInfo.aboutText);
  const [officialEmail, setOfficialEmail] = React.useState(societyInfo.contact.email);
  const [instagram, setInstagram] = React.useState(societyInfo.contact.instagram);
  const [address, setAddress] = React.useState(societyInfo.contact.location);
  const [savingSettings, setSavingSettings] = React.useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [savingPassword, setSavingPassword] = React.useState(false);

  React.useEffect(() => {
    if (societyInfo) {
      setClubName(societyInfo.name);
      setCollege(societyInfo.college || "Mirai School of Technology");
      setBatch(societyInfo.batch || "2025–29");
      setAboutText(societyInfo.aboutText);
      setOfficialEmail(societyInfo.contact.email);
      setInstagram(societyInfo.contact.instagram);
      setAddress(societyInfo.contact.location);
    }
  }, [societyInfo]);

  const handleSaveClubSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const shortName = clubName.includes("–") ? clubName.split("–")[0].trim() : (clubName.includes("-") ? clubName.split("-")[0].trim() : clubName);
    await updateSocietyInfo({
      name: clubName,
      shortName,
      college,
      batch,
      aboutText,
      contact: {
        email: officialEmail,
        instagram,
        location: address,
      },
    });
    setSavingSettings(false);
    toast({
      title: "Society Settings Saved",
      description: "Official contact details, institution affiliation, and public identity updated.",
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
          Configure official contact metadata and Super Admin credentials.
        </p>
      </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-300">Affiliated Institution</label>
                <Input value={college} onChange={(e) => setCollege(e.target.value)} required className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-300">Batch / Active Cohort</label>
                <Input value={batch} onChange={(e) => setBatch(e.target.value)} required className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
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
