"use client";

import * as React from "react";
import {
  Crown,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Search,
  Camera,
  Sparkles,
  ExternalLink,
  Instagram,
  Linkedin,
  Star,
  StarOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { deleteMemberAction } from "@/lib/actions/members";
import { ClubMember } from "@/lib/mock-data";
import {
  AddLeaderDialog,
  EditLeaderDialog,
  DeleteLeaderConfirmDialog,
} from "@/components/admin/leadership-dialogs";
import { getLeadershipRank, getLeadershipBadgeColor, isLeadershipRole, OFFICIAL_LEADERSHIP_ROLES } from "@/lib/leadership";
import { isSuperAdminEmail } from "@/lib/auth/rbac";
import Image from "next/image";
import Link from "next/link";

export default function AdminLeadershipPage() {
  const { members, updateMember, deleteMember, addMemberToState } = useAdminData();
  const { user: authUser, role: authRole } = useAuth();
  const { toast } = useToast();

  const isSuperAdmin = authUser ? isSuperAdminEmail(authUser.email || "") || authRole === "super_admin" : false;

  const [promotingId, setPromotingId] = React.useState<string | null>(null);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [selectedDefaultRole, setSelectedDefaultRole] = React.useState<string>("President");
  const [editLeader, setEditLeader] = React.useState<ClubMember | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ClubMember | null>(null);

  // Filter & Sort Leadership Members exclusively by designated leadership titles:
  // 1. President, 2. Vice President, 3. Treasurer, 4. Media Head, 5. Faculty Coordinator
  const sortedLeadership = React.useMemo(() => {
    const list = members.filter((m) => isLeadershipRole(m.specialty, m.department));

    return list.sort((a, b) => {
      const rankA = getLeadershipRank(a.specialty);
      const rankB = getLeadershipRank(b.specialty);
      if (rankA !== rankB) return rankA - rankB;
      return a.full_name.localeCompare(b.full_name);
    });
  }, [members]);

  const filteredLeaders = React.useMemo(() => {
    return sortedLeadership.filter((leader) => {
      const matchesSearch =
        leader.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leader.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leader.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [sortedLeadership, searchQuery]);

  const handleOpenAdd = (rolePreset: string = "President") => {
    setSelectedDefaultRole(rolePreset);
    setAddOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    deleteMember(deleteTarget.id);
    toast({
      title: "Executive Removed",
      description: `"${deleteTarget.full_name}" (${deleteTarget.specialty}) removed from leadership.`,
      type: "warning",
    });

    try {
      await deleteMemberAction(deleteTarget.id);
    } catch (e) {
      console.warn("Background deletion:", e);
    }
  };

  const handleToggleAdmin = async (leader: ClubMember) => {
    const isCurrentlyAdmin = leader.role === "admin";
    const newRole = isCurrentlyAdmin ? "member" : "admin";
    setPromotingId(leader.id);

    try {
      updateMember(leader.id, { role: newRole as any });

      // Persist to Supabase
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await (supabase.from("club_members") as any)
        .update({ role: newRole })
        .eq("id", leader.id);

      toast({
        title: isCurrentlyAdmin ? "Admin Access Revoked" : "Admin Access Granted ⭐",
        description: isCurrentlyAdmin
          ? `"${leader.full_name}" no longer has admin privileges. Star removed from public pages.`
          : `"${leader.full_name}" is now an Admin. Star badge visible on public pages.`,
        type: isCurrentlyAdmin ? "warning" : "success",
      });
    } catch (e) {
      toast({ title: "Failed to update role", description: String(e), type: "error" });
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-medium mb-2">
            <Crown className="h-3.5 w-3.5 text-neutral-400" /> Executive Board &amp; Core Committee
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
            Core Committee <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Manage President, Vice President, Treasurer, Media Head, and Faculty Coordinator with Instagram &amp; LinkedIn profiles for the main website.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/leadership"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07] transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
            <span>View Public Page</span>
          </Link>
          <Button variant="default" size="sm" onClick={() => handleOpenAdd("President")} className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Add Core Member</span>
          </Button>
        </div>
      </div>

      {/* Quick Add Preset Bar */}
      <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 p-5 rounded-3xl shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
              <span>Quick Appoint Core Committee Roles</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Select a position to quickly appoint and publish directly to the main website:
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {OFFICIAL_LEADERSHIP_ROLES.map((role, idx) => (
              <Button
                key={role}
                variant="outline"
                size="sm"
                onClick={() => handleOpenAdd(role)}
                className="h-8 text-xs font-medium border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-neutral-200 rounded-full"
              >
                <span className="font-mono text-[10px] text-neutral-400 mr-1">#{idx + 1}</span>
                <span>+ {role}</span>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by executive name, position, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-10 rounded-2xl bg-black/60 border-white/10 text-neutral-200"
          />
        </div>
      </div>

      {/* Core Committee Table */}
      <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
        <CardHeader className="pb-3 border-b border-white/[0.06] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-neutral-100">
              <Crown className="h-4 w-4 text-neutral-400" />
              <span>Active Core Committee Board</span>
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">
              Ordered according to institutional hierarchy (President &rarr; Vice President &rarr; Treasurer &rarr; Media Head &rarr; Faculty Coordinator).
            </CardDescription>
          </div>
          <div className="text-xs font-mono font-bold text-neutral-200 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/10">
            Total Core Members: {sortedLeadership.length}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-neutral-400 w-16">Rank</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-400">Executive Profile</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-400">Designation / Role</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-400">Academic Year</TableHead>
                <TableHead className="text-xs font-semibold text-neutral-400">Socials &amp; Contact</TableHead>
                {isSuperAdmin && (
                  <TableHead className="text-xs font-semibold text-neutral-400 text-center">Admin ⭐</TableHead>
                )}
                <TableHead className="text-xs font-semibold text-right text-neutral-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-neutral-400 text-xs">
                    No leadership executives found matching your search. Click &quot;Add Executive&quot; above to publish your leadership board.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeaders.map((leader, index) => {
                  const rank = getLeadershipRank(leader.specialty);

                  return (
                    <TableRow key={leader.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                      <TableCell>
                        <span className="font-mono text-xs font-medium text-neutral-300 bg-black/60 px-2 py-0.5 rounded-md border border-white/10">
                          #{index + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {leader.avatar_url ? (
                            <div className="relative h-10 w-10 shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-sm bg-neutral-900">
                              <Image
                                src={leader.avatar_url}
                                alt={leader.full_name}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-800 border border-white/10 text-neutral-200 font-bold text-xs shadow-sm">
                              {leader.avatar_initials}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-neutral-100 text-xs flex items-center gap-1.5">
                              <span>{leader.full_name}</span>
                              {leader.avatar_url && (
                                <span title="Portrait Attached">
                                  <Camera className="h-3 w-3 text-neutral-400" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 line-clamp-1 max-w-[200px]">
                              {leader.bio || "MALHAR Executive"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="text-[11px] font-medium border border-white/10 bg-white/[0.05] text-neutral-200 uppercase tracking-wider flex items-center gap-1 w-fit rounded-full px-2.5 py-0.5"
                        >
                          {rank === 1 && <Crown className="h-3 w-3 text-neutral-300" />}
                          <span>{leader.specialty}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-neutral-300 font-medium">
                        {leader.year || "3rd Year"}
                      </TableCell>
                      <TableCell className="text-xs text-neutral-400">
                        <div className="flex items-center gap-2">
                          {leader.socials?.instagram ? (
                            <a
                              href={leader.socials.instagram}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md bg-white/[0.04] text-neutral-300 border border-white/10 hover:bg-white/[0.08]"
                              title="Instagram Link"
                            >
                              <Instagram className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="p-1 rounded-md bg-neutral-900 text-neutral-600 border border-white/5" title="No Instagram">
                              <Instagram className="h-3.5 w-3.5" />
                            </span>
                          )}

                          {leader.socials?.linkedin ? (
                            <a
                              href={leader.socials.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md bg-white/[0.04] text-neutral-300 border border-white/10 hover:bg-white/[0.08]"
                              title="LinkedIn Link"
                            >
                              <Linkedin className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="p-1 rounded-md bg-neutral-900 text-neutral-600 border border-white/5" title="No LinkedIn">
                              <Linkedin className="h-3.5 w-3.5" />
                            </span>
                          )}

                          <span className="text-[11px] font-mono text-neutral-500 ml-1 truncate max-w-[140px]">
                            {leader.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Super Admin Only: Grant/Revoke Admin Star */}
                          {isSuperAdmin && (() => {
                            const isAdmin = leader.role === "admin" || isSuperAdminEmail(leader.email);
                            const isSelf = isSuperAdminEmail(leader.email);
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isSelf || promotingId === leader.id}
                                onClick={() => handleToggleAdmin(leader)}
                                title={isSelf ? "Super Admin always has star" : isAdmin ? "Revoke Admin Star" : "Grant Admin Star"}
                                className={`h-8 px-2 text-xs rounded-full transition-colors ${
                                  isAdmin
                                    ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-950/20"
                                    : "text-neutral-500 hover:text-yellow-400 hover:bg-yellow-950/10"
                                }`}
                              >
                                {promotingId === leader.id ? (
                                  <span className="animate-spin h-3.5 w-3.5 rounded-full border border-t-transparent border-yellow-400 inline-block" />
                                ) : isAdmin ? (
                                  <><Star className="h-3.5 w-3.5 fill-yellow-400" /><span className="ml-1 hidden sm:inline">Admin</span></>
                                ) : (
                                  <><StarOff className="h-3.5 w-3.5" /><span className="ml-1 hidden sm:inline">Grant</span></>
                                )}
                              </Button>
                            );
                          })()}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditLeader(leader)}
                            className="h-8 px-2 text-xs text-neutral-400 hover:text-neutral-200 rounded-full"
                            title="Edit Profile"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(leader)}
                            className="h-8 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-full"
                            title="Remove from Leadership"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Modals */}
      <AddLeaderDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultSpecialty={selectedDefaultRole}
        onSuccess={(newLeader) => {
          addMemberToState(newLeader);
          toast({
            title: "Executive Appointed",
            description: `"${newLeader.full_name}" is now published as ${newLeader.specialty} on the leadership board.`,
            type: "success",
          });
        }}
      />

      <EditLeaderDialog
        leader={editLeader}
        open={!!editLeader}
        onOpenChange={(op) => !op && setEditLeader(null)}
        onSuccess={(updatedLeader) => {
          updateMember(updatedLeader.id, updatedLeader);
          toast({
            title: "Profile Updated",
            description: `"${updatedLeader.full_name}" leadership records synchronized.`,
            type: "success",
          });
        }}
      />

      <DeleteLeaderConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(op) => !op && setDeleteTarget(null)}
        title="Remove from Leadership"
        description={`Are you sure you want to remove "${deleteTarget?.full_name}" (${deleteTarget?.specialty}) from the leadership board?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
