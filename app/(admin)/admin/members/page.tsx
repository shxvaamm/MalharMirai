"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Shield,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Loader2,
  Camera,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/components/ui/toast";
import {
  AddMemberDialog,
  EditMemberDialog,
  ChangeRoleDialog,
  DeleteConfirmDialog,
} from "@/components/admin/member-dialogs";
import { deleteMemberAction } from "@/lib/actions/members";
import { ClubMember, MOCK_DEPARTMENTS } from "@/lib/mock-data";
import { isSuperAdminEmail } from "@/lib/auth/rbac";
import { isLeadershipRole } from "@/lib/leadership";
import { Star, Crown, X } from "lucide-react";

export default function AdminMembersPage() {
  const router = useRouter();
  const {
    members,
    events,
    departments,
    stats,
    updateStats,
    addMemberToState,
    updateMember,
    deleteMember,
    changeRole,
    loading,
  } = useAdminData();
  const { user: authUser, role: authRole } = useAuth();
  const { toast } = useToast();

  // Super admin check
  const isSuperAdmin = authUser
    ? isSuperAdminEmail(authUser.email || "") || authRole === "super_admin"
    : false;

  // Slide panel state
  const [rolePanelMember, setRolePanelMember] = React.useState<ClubMember | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<"member" | "admin">("member");
  const [savingRole, setSavingRole] = React.useState(false);

  const openRolePanel = (m: ClubMember) => {
    setSelectedRole((m.role === "admin" ? "admin" : "member") as any);
    setRolePanelMember(m);
  };

  const closeRolePanel = () => setRolePanelMember(null);

  const handleSaveRole = async () => {
    if (!rolePanelMember) return;
    setSavingRole(true);
    try {
      updateMember(rolePanelMember.id, { role: selectedRole });

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await (supabase.from("club_members") as any)
        .update({ role: selectedRole })
        .eq("id", rolePanelMember.id);

      toast({
        title: selectedRole === "admin" ? `Admin Access Granted ⭐` : "Role Updated",
        description:
          selectedRole === "admin"
            ? `"${rolePanelMember.full_name}" is now an Admin. Star badge visible on public pages.`
            : `"${rolePanelMember.full_name}" role set to Member.`,
        type: "success",
      });
      closeRolePanel();
    } catch (e) {
      toast({ title: "Failed to save role", description: String(e), type: "error" });
    } finally {
      setSavingRole(false);
    }
  };

  const [searchQuery, setSearchQuery] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState("all");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const itemsPerPage = 8;

  // Public Events counter modal state
  const [isEventCountModalOpen, setIsEventCountModalOpen] = React.useState(false);
  const [public_events_count, setPublicEventsCount] = React.useState<number>(
    stats?.eventsOrganised !== undefined ? stats.eventsOrganised : 5
  );
  const [isSavingEventCount, setIsSavingEventCount] = React.useState(false);

  // Active Members counter modal state
  const [isMemberCountModalOpen, setIsMemberCountModalOpen] = React.useState(false);
  const [public_members_count, setPublicMembersCount] = React.useState<number>(
    stats?.activeMembers !== undefined ? stats.activeMembers : 1
  );
  const [isSavingMemberCount, setIsSavingMemberCount] = React.useState(false);

  React.useEffect(() => {
    if (stats?.activeMembers !== undefined) {
      setPublicMembersCount(stats.activeMembers);
    }
  }, [stats?.activeMembers]);

  React.useEffect(() => {
    if (stats?.eventsOrganised !== undefined) {
      setPublicEventsCount(stats.eventsOrganised);
    }
  }, [stats?.eventsOrganised]);

  const handleSaveActiveCountModal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = Number(public_members_count) >= 0 ? Number(public_members_count) : 7;
    setIsSavingMemberCount(true);

    try {
      const supabase = createClient();
      await (supabase.from("site_settings") as any).upsert([
        { key: "public_active_members", value: String(val), updated_at: new Date().toISOString() },
        { key: "active_members", value: String(val), updated_at: new Date().toISOString() },
      ], { onConflict: "key" });
      await (supabase.from("club_stats") as any).upsert({
        id: "current",
        active_members: val,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    } catch (err) {
      console.warn("Direct Supabase write:", err);
    }

    await updateStats({ activeMembers: val });
    setIsSavingMemberCount(false);
    setIsMemberCountModalOpen(false);
    window.location.reload();
  };

  const handleSaveEventsCountModal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = Number(public_events_count) >= 0 ? Number(public_events_count) : 8;
    setIsSavingEventCount(true);

    try {
      const supabase = createClient();
      await (supabase.from("site_settings") as any).upsert([
        { key: "public_events_organised", value: String(val), updated_at: new Date().toISOString() },
        { key: "events_organised", value: String(val), updated_at: new Date().toISOString() },
      ], { onConflict: "key" });
      await (supabase.from("club_stats") as any).upsert({
        id: "current",
        events_organised: val,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    } catch (err) {
      console.warn("Direct Supabase write:", err);
    }

    await updateStats({ eventsOrganised: val });
    setIsSavingEventCount(false);
    setIsEventCountModalOpen(false);
    window.location.reload();
  };

  // Dialog states
  const [addOpen, setAddOpen] = React.useState(false);
  const [editMember, setEditMember] = React.useState<ClubMember | null>(null);
  const [roleMember, setRoleMember] = React.useState<ClubMember | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ClubMember | null>(null);

  const filteredMembers = React.useMemo(() => {
    return members.filter((m) => {
      // Exclude executive leaders (managed in /admin/leadership)
      if (isLeadershipRole(m.specialty, m.department)) return false;

      const matchDept = deptFilter === "all" || m.department === deptFilter;
      const matchRole = roleFilter === "all" || m.role === roleFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q);
      return matchDept && matchRole && matchQuery;
    });
  }, [members, deptFilter, roleFilter, searchQuery]);


  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const paginatedMembers = filteredMembers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleDeleteMember = async () => {
    if (!deleteTarget) return;

    const targetId = deleteTarget.id;
    const targetName = deleteTarget.full_name;

    deleteMember(targetId);
    setDeleteTarget(null);

    toast({
      title: "Member Deleted",
      description: `"${targetName}" removed from society roster.`,
      type: "warning",
    });

    try {
      await deleteMemberAction(targetId);
    } catch (e) {
      console.warn("Background deletion sync:", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-medium mb-2">
            <Users className="h-3.5 w-3.5 text-neutral-400" /> Society Member Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
            Society <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Members</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Manage coordinators and active contributors across all 5 official MALHAR departments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 rounded-full border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07]"
          >
            <Link href="/admin/team">
              <Shield className="h-4 w-4 text-neutral-400" />
              <span>Team & Roles</span>
            </Link>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 shadow-sm rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Member</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Statistics Metric Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Active Members Metric Control Card */}
        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/[0.04] border border-white/10 text-neutral-300 flex items-center justify-center font-bold">
                <Users className="h-5 w-5 text-neutral-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                  <span>Public Display Active Members:</span>
                  <span className="text-base font-bold text-neutral-100 font-mono">
                    {stats?.activeMembers !== undefined ? stats.activeMembers : 1}+
                  </span>
                  <Badge variant="upcoming" className="text-[10px]">Real-Time</Badge>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Database Roster Total: <span className="font-semibold text-neutral-200">{members.length} members enrolled</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPublicMembersCount(stats?.activeMembers !== undefined ? stats.activeMembers : 1);
                  setIsMemberCountModalOpen(true);
                }}
                className="border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07] rounded-full text-xs font-medium"
              >
                Edit Member Count
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateStats({ activeMembers: members.length });
                  toast({
                    title: "Synced to Roster Count",
                    description: `Active members set to match roster total (${members.length}).`,
                    type: "success",
                  });
                }}
                className="text-xs text-neutral-400 hover:text-neutral-200 rounded-full"
                title="Sync with current database count"
              >
                Auto-Sync ({members.length})
              </Button>
            </div>
          </div>
        </Card>

        {/* Card 2: Events Organised Metric Control Card */}
        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/[0.04] border border-white/10 text-neutral-300 flex items-center justify-center font-bold">
                <Calendar className="h-5 w-5 text-neutral-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                  <span>Public Display Events Organised:</span>
                  <span className="text-base font-bold text-neutral-100 font-mono">
                    {stats?.eventsOrganised !== undefined ? stats.eventsOrganised : 5}+
                  </span>
                  <Badge variant="upcoming" className="text-[10px]">Real-Time</Badge>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Database Events Total: <span className="font-semibold text-neutral-200">{events.length} events scheduled</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPublicEventsCount(stats?.eventsOrganised !== undefined ? stats.eventsOrganised : 5);
                  setIsEventCountModalOpen(true);
                }}
                className="border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07] rounded-full text-xs font-medium"
              >
                Edit Event Count
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateStats({ eventsOrganised: events.length });
                  toast({
                    title: "Synced to Events Count",
                    description: `Events organised set to match events total (${events.length}).`,
                    type: "success",
                  });
                }}
                className="text-xs text-neutral-400 hover:text-neutral-200 rounded-full"
                title="Sync with current database count"
              >
                Auto-Sync ({events.length})
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Controls */}
      <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by name, email, department..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-xs h-10 rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                className="flex h-10 rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-medium text-neutral-200 focus-visible:outline-none"
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                className="flex h-10 rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-medium text-neutral-200 focus-visible:outline-none"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Roles</option>
                <option value="member">Official Members</option>
                <option value="admin">Administrators</option>
                <option value="volunteer">Volunteers</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading && filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              <p className="text-xs text-neutral-400">Loading society members from database...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-neutral-400">Member / Coordinator</TableHead>
                  <TableHead className="text-neutral-400">Department</TableHead>
                  <TableHead className="text-neutral-400">Role</TableHead>
                  <TableHead className="text-neutral-400">Year</TableHead>
                  <TableHead className="text-neutral-400">Contact</TableHead>
                  <TableHead className="text-right text-neutral-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-neutral-400 text-xs">
                      Looking for Other Members? No matching records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMembers.map((m) => (
                    <TableRow key={m.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {m.avatar_url ? (
                            <div className="relative h-8 w-8 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-neutral-900 shadow-sm">
                              <Image src={m.avatar_url} alt={m.full_name} fill unoptimized className="object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-800 border border-white/10 text-neutral-200 font-bold text-xs shadow-sm">
                              {m.avatar_initials}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                              <span>{m.full_name}</span>
                              {m.avatar_url && (
                                <span title="Photo Attached">
                                  <Camera className="h-3 w-3 text-neutral-400" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400">{m.specialty}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-neutral-300">
                        {m.department}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={m.role as any}
                          className="capitalize text-[10px] bg-white/[0.05] text-neutral-300 border-white/10"
                        >
                          {m.role}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs font-medium text-neutral-300">
                        {m.year || "1st Year"}
                      </TableCell>

                      <TableCell className="text-xs text-neutral-400">
                        <div>{m.email}</div>
                        <div className="text-[10px] text-neutral-500">{m.phone}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Super Admin Only: Role Slide Panel Trigger */}
                          {isSuperAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRolePanel(m)}
                              title="Manage Admin Access"
                              className={`h-8 px-2 text-xs rounded-full transition-colors ${
                                m.role === "admin"
                                  ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-950/20"
                                  : "text-neutral-500 hover:text-yellow-400 hover:bg-yellow-950/10"
                              }`}
                            >
                              <Star className={`h-3.5 w-3.5 ${m.role === "admin" ? "fill-yellow-400" : ""}`} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRoleMember(m)}
                            className="h-8 px-2 text-xs text-neutral-400 hover:text-neutral-200 rounded-full"
                            title="Change Role"
                          >
                            <Shield className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditMember(m)}
                            className="h-8 px-2 text-xs text-neutral-400 hover:text-neutral-200 rounded-full"
                            title="Edit Profile"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(m)}
                            className="h-8 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-full"
                            title="Delete Member"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] text-xs text-neutral-400">
            <span>
              Showing {paginatedMembers.length} of {filteredMembers.length} members
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 p-0 border-white/10 rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-mono font-semibold text-neutral-200 px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 w-8 p-0 border-white/10 rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Super Admin Role Slide Panel ─── */}
      {isSuperAdmin && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeRolePanel}
            className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
              rolePanelMember ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          />
          {/* Slide Panel */}
          <div
            className={`fixed right-0 top-0 h-full z-50 w-80 max-w-full bg-[#111111] border-l border-white/[0.08] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
              rolePanelMember ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-bold text-neutral-100">Manage Admin Access</span>
              </div>
              <button
                onClick={closeRolePanel}
                className="p-1.5 rounded-full hover:bg-white/[0.06] text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Member Info */}
            {rolePanelMember && (
              <div className="flex-1 flex flex-col px-5 py-5 gap-5 overflow-y-auto">
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                  {rolePanelMember.avatar_url ? (
                    <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
                      <Image src={rolePanelMember.avatar_url} alt={rolePanelMember.full_name} fill unoptimized className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-800 border border-white/10 text-neutral-200 font-bold text-base">
                      {rolePanelMember.avatar_initials}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-neutral-100 text-sm">{rolePanelMember.full_name}</div>
                    <div className="text-[11px] text-neutral-400">{rolePanelMember.email}</div>
                    <div className="text-[11px] text-neutral-500">{rolePanelMember.department}</div>
                  </div>
                </div>

                {/* Current Role */}
                <div className="text-xs text-neutral-400">
                  Current role: <span className="font-semibold text-neutral-200 capitalize">{rolePanelMember.role}</span>
                  {rolePanelMember.role === "admin" && <span className="ml-1.5 text-yellow-400">⭐</span>}
                </div>

                {/* Role Selector */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-neutral-300 mb-1">Assign Role:</p>

                  {/* Member Option */}
                  <button
                    onClick={() => setSelectedRole("member")}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      selectedRole === "member"
                        ? "border-white/30 bg-white/[0.06]"
                        : "border-white/[0.06] bg-transparent hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedRole === "member" ? "border-white bg-white" : "border-neutral-600"
                    }`}>
                      {selectedRole === "member" && <div className="h-2 w-2 rounded-full bg-neutral-900" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-neutral-200">Member</div>
                      <div className="text-[11px] text-neutral-500">Access to public pages only. No admin portal.</div>
                    </div>
                  </button>

                  {/* Admin Option */}
                  <button
                    onClick={() => setSelectedRole("admin")}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      selectedRole === "admin"
                        ? "border-yellow-400/40 bg-yellow-950/10"
                        : "border-white/[0.06] bg-transparent hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedRole === "admin" ? "border-yellow-400 bg-yellow-400" : "border-neutral-600"
                    }`}>
                      {selectedRole === "admin" && <div className="h-2 w-2 rounded-full bg-neutral-900" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-neutral-200 flex items-center gap-1.5">
                        Admin <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="text-[11px] text-neutral-500">Full admin portal access. Star badge visible on public pages.</div>
                    </div>
                  </button>
                </div>

                {/* Info Note */}
                <div className="text-[11px] text-neutral-500 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  ⭐ Star badge appears on public Members &amp; Leadership pages for all Admins and Super Admins.
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="px-5 py-4 border-t border-white/[0.08]">
              <Button
                onClick={handleSaveRole}
                disabled={savingRole || !rolePanelMember}
                className="w-full rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] h-10"
              >
                {savingRole ? (
                  <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-t-transparent border-neutral-700 rounded-full animate-spin" /> Saving...</span>
                ) : (
                  `Save Role for ${rolePanelMember?.full_name?.split(" ")[0] ?? "Member"}`
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Dialog Modals */}
      <AddMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={(newM) => {
          addMemberToState(newM);
          toast({
            title: "Member Enrolled",
            description: `"${newM.full_name}" added to ${newM.department}.`,
            type: "success",
          });
        }}
        onError={(err) => {
          toast({
            title: "Enrollment Failed",
            description: err,
            type: "error",
          });
        }}
      />

      <EditMemberDialog
        member={editMember}
        open={!!editMember}
        onOpenChange={(op) => !op && setEditMember(null)}
        onSuccess={(updated) => {
          updateMember(updated.id, updated);
          toast({
            title: "Profile Updated",
            description: `"${updated.full_name}" records saved.`,
            type: "success",
          });
        }}
        onError={(err) => {
          toast({
            title: "Update Failed",
            description: err,
            type: "error",
          });
        }}
      />

      <ChangeRoleDialog
        member={roleMember}
        open={!!roleMember}
        onOpenChange={(op) => !op && setRoleMember(null)}
        onSuccess={(id, newR) => {
          changeRole(id, newR);
          toast({
            title: "User Role Modified",
            description: `Privileges updated to "${newR}".`,
            type: "success",
          });
        }}
        onError={(err) => {
          toast({
            title: "Role Update Failed",
            description: err,
            type: "error",
          });
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(op) => !op && setDeleteTarget(null)}
        title="Delete Member"
        description={`Are you sure you want to permanently remove "${deleteTarget?.full_name}" from the society roster?`}
        onConfirm={handleDeleteMember}
      />

      {/* Edit Public Events Count Modal */}
      <Dialog open={isEventCountModalOpen} onOpenChange={setIsEventCountModalOpen}>
        <DialogContent className="max-w-md bg-[#0D0D0D] border border-white/10 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-neutral-300" />
              <span>Edit Public Events Count</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Update the total number of events organised shown on the public Homepage and About page. This saves to Supabase <code className="text-neutral-300">site_settings</code>, <code className="text-neutral-300">club_stats</code>, and local storage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEventsCountModal} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold block mb-1.5 text-neutral-300">
                Public Events Organised Count
              </label>
              <Input
                type="number"
                min={0}
                value={public_events_count}
                onChange={(e) => setPublicEventsCount(Number(e.target.value))}
                placeholder="e.g. 12"
                required
                className="text-sm font-mono font-bold rounded-2xl bg-black/60 border-white/10 text-neutral-100 h-11"
              />
              <span className="text-[11px] text-neutral-500 mt-1.5 block">
                Public displays will render &ldquo;{public_events_count}+&rdquo; on Homepage and About pages.
              </span>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEventCountModalOpen(false)}
                disabled={isSavingEventCount}
                className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isSavingEventCount}
                className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]"
              >
                {isSavingEventCount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save Event Count"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Public Active Members Count Modal */}
      <Dialog open={isMemberCountModalOpen} onOpenChange={setIsMemberCountModalOpen}>
        <DialogContent className="max-w-md bg-[#0D0D0D] border border-white/10 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-neutral-300" />
              <span>Edit Public Active Members Count</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Update the total number of active members shown on the public Homepage and About page. This saves to Supabase <code className="text-neutral-300">site_settings</code>, <code className="text-neutral-300">club_stats</code>, and local storage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveActiveCountModal} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold block mb-1.5 text-neutral-300">
                Public Active Members Count
              </label>
              <Input
                type="number"
                min={0}
                value={public_members_count}
                onChange={(e) => setPublicMembersCount(Number(e.target.value))}
                placeholder="e.g. 48"
                required
                className="text-sm font-mono font-bold rounded-2xl bg-black/60 border-white/10 text-neutral-100 h-11"
              />
              <span className="text-[11px] text-neutral-500 mt-1.5 block">
                Public displays will render &ldquo;{public_members_count}+&rdquo; on Homepage and About pages.
              </span>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMemberCountModalOpen(false)}
                disabled={isSavingMemberCount}
                className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isSavingMemberCount}
                className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]"
              >
                {isSavingMemberCount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save Member Count"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
