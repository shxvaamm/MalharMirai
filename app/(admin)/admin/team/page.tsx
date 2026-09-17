"use client";

import * as React from "react";
import Image from "next/image";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserPlus,
  UserMinus,
  Crown,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  Phone,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
  History,
  Key,
  Users,
  Edit,
  Trash2,
  ArrowLeftRight,
  RefreshCw,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole, isSuperAdminEmail, SUPER_ADMIN_EMAILS, getRoleDisplayName, getRoleBadgeColor } from "@/lib/auth/rbac";

import { ClubMember, MOCK_MEMBERS } from "@/lib/mock-data";
import {
  updateUserRoleAction,
  transferSuperAdminAction,
  getAdminContactsAction,
  getAuditLogsAction,
  AdminContact,
  AuditLogEntry,
} from "@/lib/actions/roles";
import {
  getRegisteredCredentials,
  updateRegisteredUserRole,
  deleteRegisteredCredential,
  transferSuperAdminInStore,
  getActiveSuperAdminEmail,
  appointNewAdmin,
} from "@/lib/auth/credentials-store";
import { getSyncedData, setSyncedData, STORAGE_KEYS } from "@/lib/store/sync-store";

export default function AdminTeamManagementPage() {
  const { members, changeRole, deleteMember } = useAdminData();
  const { user: authUser, role: authRole } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<"roles" | "admins" | "audit">("roles");

  // Filters & Search
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [authMethodFilter, setAuthMethodFilter] = React.useState<string>("all");

  // Dynamic Administrator Contacts & Audit Logs
  const [adminContacts, setAdminContacts] = React.useState<AdminContact[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogEntry[]>([]);
  const [loadingContacts, setLoadingContacts] = React.useState(false);

  // Edit Role Modal State
  const [editTarget, setEditTarget] = React.useState<{
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    authMethod: "Google" | "Email/Password" | "Both";
    status: string;
    createdAt: string;
  } | null>(null);

  // Delete Target Modal State
  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null>(null);

  const [selectedNewRole, setSelectedNewRole] = React.useState<UserRole>("member");
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [showTransferModal, setShowTransferModal] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);

  // Appoint Administrator Modal State
  const [showAppointModal, setShowAppointModal] = React.useState(false);
  const [appointName, setAppointName] = React.useState("");
  const [appointEmail, setAppointEmail] = React.useState("");
  const [appointDept, setAppointDept] = React.useState("Management Department");
  const [appointSpecialty, setAppointSpecialty] = React.useState("Society Administrator");
  const [appointPassword, setAppointPassword] = React.useState("Admin@2026");
  const [appointLoading, setAppointLoading] = React.useState(false);

  // Current logged in user details
  const currentUserEmail = authUser?.email?.toLowerCase().trim() || "shvxamkumar@gmail.com";
  const activeSuperAdminEmail = typeof window !== "undefined" ? getActiveSuperAdminEmail() : "shvxamkumar@gmail.com";
  const isSuperAdmin =
    authRole === "super_admin" ||
    isSuperAdminEmail(currentUserEmail) ||
    currentUserEmail === activeSuperAdminEmail;

  // Build unified user roster from members + registered credentials
  const allUsersList = React.useMemo(() => {
    const creds = typeof window !== "undefined" ? getRegisteredCredentials() : [];
    const membersList = members || [];
    const map = new Map<string, {
      id: string;
      fullName: string;
      email: string;
      role: UserRole;
      authMethod: "Google" | "Email/Password" | "Both";
      status: string;
      department?: string;
      specialty?: string;
      avatarUrl?: string;
      createdAt: string;
    }>();

    // Add mock / database members
    membersList.forEach((m) => {
      const email = m.email.toLowerCase().trim();
      const isSuper = isSuperAdminEmail(email);
      const effectiveRole: UserRole = isSuper ? "super_admin" : (m.role === "admin" ? "admin" : (m.role === "volunteer" ? "volunteer" : "member"));

      map.set(email, {
        id: m.id,
        fullName: m.full_name,
        email: m.email,
        role: effectiveRole,
        authMethod: email.includes("@gmail.com") ? "Google" : "Email/Password",
        status: "Active",
        department: m.department,
        specialty: m.specialty,
        avatarUrl: m.avatar_url,
        createdAt: "2025-01-15T00:00:00Z",
      });
    });

    // Merge registered accounts
    creds.forEach((c) => {
      const email = c.email.toLowerCase().trim();
      const existing = map.get(email);
      const isSuper = isSuperAdminEmail(email);
      const effectiveRole: UserRole = isSuper
        ? "super_admin"
        : (c.role === "admin" || existing?.role === "admin" ? "admin" : (c.role === "volunteer" ? "volunteer" : "member"));

      if (existing) {
        existing.fullName = c.fullName || existing.fullName;
        existing.role = effectiveRole;
        existing.authMethod = "Both";
        map.set(email, {
          id: `reg-${email}`,
          fullName: c.fullName || (isSuper ? "Shivam Kumar" : "User"),
          email: c.email,
          role: effectiveRole,
          authMethod: email.includes("@gmail.com") ? "Both" : "Email/Password",
          status: "Active",
          department: c.department || "Executive Council",
          createdAt: c.createdAt || new Date().toISOString(),
        });
      }
    });

    return Array.from(map.values());
  }, [members, activeSuperAdminEmail]);

  // Load Administrator Contacts & Audit Logs
  const refreshAdminData = React.useCallback(async () => {
    setLoadingContacts(true);
    try {
      // Build authoritative admins directly from the live, synced unified user list
      const admins = allUsersList
        .filter((u) => u.role === "super_admin" || u.role === "admin")
        .map((u) => ({
          id: u.id,
          full_name: u.fullName,
          email: u.email,
          role: u.role as "super_admin" | "admin",
          department: u.department || "Executive Council",
          specialty: u.specialty || (u.role === "super_admin" ? "Root Super Admin" : "Society Administrator"),
          status: "Active" as const,
          authMethod: u.authMethod,
          createdAt: u.createdAt,
          avatar_url: u.avatarUrl,
        }));
      setAdminContacts(admins);

      const logsRes = await getAuditLogsAction();
      if (logsRes.success && logsRes.data) {
        setAuditLogs(logsRes.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingContacts(false);
    }
  }, [allUsersList]);

  React.useEffect(() => {
    refreshAdminData();
  }, [refreshAdminData]);

  // Filtered Users List for Role Management
  const filteredUsers = React.useMemo(() => {
    return allUsersList.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q));

      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchAuth =
        authMethodFilter === "all" ||
        u.authMethod.toLowerCase() === authMethodFilter.toLowerCase();

      return matchSearch && matchRole && matchAuth;
    });
  }, [allUsersList, searchQuery, roleFilter, authMethodFilter]);

  // Handle opening role edit modal
  const handleOpenEdit = (user: typeof allUsersList[0]) => {
    if (isSuperAdminEmail(user.email)) {
      toast({
        title: "Protected Account",
        description: "Super Admin (shvxamkumar@gmail.com) is permanent and cannot be modified or demoted.",
        type: "info",
      });
      return;
    }
    setEditTarget(user);
    setSelectedNewRole(user.role === "admin" ? "admin" : "member");
  };

  // Handle opening delete confirmation modal
  const handleOpenDelete = (target: { id: string; fullName: string; email: string; role: string }) => {
    if (isSuperAdminEmail(target.email)) {
      toast({
        title: "Protected Root Super Admin",
        description: "Super Admin account (shvxamkumar@gmail.com) is permanently protected and cannot be deleted.",
        type: "info",
      });
      return;
    }
    setDeleteTarget(target);
  };

  // Execute account / administrator deletion
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (isSuperAdminEmail(deleteTarget.email)) {
      toast({
        title: "Protected Account",
        description: "Super Admin account cannot be deleted.",
        type: "error",
      });
      setDeleteTarget(null);
      return;
    }

    setProcessing(true);
    const targetEmail = deleteTarget.email.toLowerCase().trim();
    const targetId = deleteTarget.id;
    const targetName = deleteTarget.fullName;

    // 1. Delete from registered credentials store & synced members store
    deleteRegisteredCredential(targetEmail);
    deleteMember(targetId, targetEmail);

    // 2. Optimistically update local adminContacts list
    setAdminContacts((prev) =>
      prev.filter((a) => a.email.toLowerCase().trim() !== targetEmail && a.id !== targetId)
    );

    toast({
      title: "Account Removed",
      description: `"${targetName}" (${deleteTarget.email}) has been removed.`,
      type: "warning",
    });

    setDeleteTarget(null);
    setProcessing(false);

    // 3. Background deletion on Supabase
    try {
      const { deleteMemberAction } = await import("@/lib/actions/members");
      await deleteMemberAction(targetId);
    } catch (err) {
      console.warn("Background deletion sync:", err);
    }
  };

  // Submit role change intent
  const handleRoleSelectionSubmit = () => {
    if (!editTarget) return;

    if (selectedNewRole === editTarget.role) {
      toast({
        title: "No Role Change",
        description: `User "${editTarget.fullName}" already holds the "${getRoleDisplayName(selectedNewRole)}" role.`,
        type: "info",
      });
      setEditTarget(null);
      return;
    }

    setShowConfirmModal(true);
  };

  // Execute role change (Member <-> Admin)
  const handleConfirmRoleChange = async () => {
    if (!editTarget) return;

    setProcessing(true);
    try {
      const res = await updateUserRoleAction(editTarget.id, selectedNewRole, editTarget.email);

      if (!res.success) {
        toast({
          title: "Role Update Failed",
          description: res.error || "Could not update user role.",
          type: "error",
        });
        return;
      }

      // Sync in local/offline store
      updateRegisteredUserRole(editTarget.email, selectedNewRole);
      changeRole(editTarget.id, selectedNewRole as any);

      toast({
        title: "Role Successfully Updated",
        description: `"${editTarget.fullName}" has been changed to ${getRoleDisplayName(selectedNewRole)}.`,
        type: "success",
      });

      setShowConfirmModal(false);
      setEditTarget(null);
      refreshAdminData();
    } catch (err: any) {
      toast({
        title: "Role Update Error",
        description: err?.message || "Failed to update role.",
        type: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Appoint new Administrator handler
  const handleAppointAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointEmail.trim() || !appointName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both Administrator name and email address.",
        type: "error",
      });
      return;
    }

    const normEmail = appointEmail.trim().toLowerCase();
    if (isSuperAdminEmail(normEmail)) {
      toast({
        title: "Super Admin",
        description: "This email is already the root Super Admin of MALHAR.",
        type: "info",
      });
      return;
    }

    setAppointLoading(true);
    try {
      const res = appointNewAdmin({
        email: normEmail,
        fullName: appointName.trim(),
        department: appointDept.trim(),
        specialty: appointSpecialty.trim(),
        initialPassword: appointPassword.trim() || "Admin@2026",
      });

      if (!res.success) {
        toast({
          title: "Failed to Appoint",
          description: res.error || "Could not appoint administrator.",
          type: "error",
        });
        return;
      }

      toast({
        title: "Administrator Appointed",
        description: `"${appointName.trim()}" (${normEmail}) is now an authorized Administrator with console login access.`,
        type: "success",
      });

      setAppointName("");
      setAppointEmail("");
      setAppointPassword("Admin@2026");
      setShowAppointModal(false);
      refreshAdminData();
    } catch (err: any) {
      toast({
        title: "Appointment Error",
        description: err?.message || "Failed to appoint administrator.",
        type: "error",
      });
    } finally {
      setAppointLoading(false);
    }
  };


  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-medium mb-2">
            <Crown className="h-3.5 w-3.5 text-neutral-400" /> Identity &amp; Access Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
            Role &amp; <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Administrator Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Configure system privileges, transfer Super Admin ownership, and manage the authoritative administrator contacts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowAppointModal(true)}
            className="rounded-full text-xs font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm flex items-center gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Appoint Administrator</span>
          </Button>

          <Badge
            variant="admin"
            className="text-xs px-3.5 py-1.5 font-mono font-bold flex items-center gap-1.5 rounded-full border-white/10 bg-white/[0.05] text-neutral-300"
          >
            {isSuperAdmin ? <Crown className="h-3.5 w-3.5 text-neutral-300" /> : <Shield className="h-3.5 w-3.5 text-neutral-400" />}
            <span>{isSuperAdmin ? "Super Admin Portal" : "Administrator Portal"}</span>
          </Badge>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/[0.06] gap-2 sm:gap-6">
        <button
          onClick={() => setActiveTab("roles")}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "roles"
              ? "border-neutral-300 text-neutral-100"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User &amp; Role Management ({allUsersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("admins")}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "admins"
              ? "border-neutral-300 text-neutral-100"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-neutral-400" />
          <span>Administrators &amp; Contacts ({adminContacts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "audit"
              ? "border-neutral-300 text-neutral-100"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <History className="h-4 w-4 text-neutral-400" />
          <span>Audit Log &amp; Transfers</span>
        </button>
      </div>

      {/* ======================= TAB 1: USER & ROLE MANAGEMENT ======================= */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          {/* Rules Banner */}
          <Card className="glass-panel border-white/[0.08] p-4 rounded-3xl bg-white/[0.02]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="h-9 w-9 shrink-0 rounded-2xl bg-white/[0.05] border border-white/10 text-neutral-200 flex items-center justify-center font-bold">
                  <Crown className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-neutral-100 flex items-center gap-2">
                    <span>Role Hierarchy: 1 Super Admin + Unlimited Administrators</span>
                    <Badge variant="upcoming" className="text-[10px] rounded-full border-white/10 bg-white/[0.04] text-neutral-300">System Enforced</Badge>
                  </h3>
                  <p className="text-[11px] text-neutral-400 leading-relaxed max-w-3xl">
                    Exactly <strong className="text-neutral-200 font-bold">1 Super Admin</strong> holds permanent root authority. The Super Admin can appoint <strong className="text-neutral-200 font-bold">unlimited Administrators</strong> to coordinate departments, publish announcements, manage event registrations, and oversee society operations.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAppointModal(true)}
                className="shrink-0 rounded-full text-xs border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.08] flex items-center gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5 text-neutral-300" />
                <span>+ Appoint Admin</span>
              </Button>
            </div>
          </Card>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9 bg-black/60 border-white/10 rounded-2xl text-neutral-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Filter className="h-3.5 w-3.5" />
                <span>Role:</span>
              </div>
              <select
                className="flex h-9 rounded-2xl border border-white/10 bg-black/60 px-2.5 py-1 text-xs text-neutral-200 focus-visible:outline-none"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin (1)</option>
                <option value="admin">Administrator</option>
                <option value="member">Official Member</option>
                <option value="volunteer">Volunteer</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs text-neutral-400 ml-2">
                <Key className="h-3.5 w-3.5" />
                <span>Auth:</span>
              </div>
              <select
                className="flex h-9 rounded-2xl border border-white/10 bg-black/60 px-2.5 py-1 text-xs text-neutral-200 focus-visible:outline-none"
                value={authMethodFilter}
                onChange={(e) => setAuthMethodFilter(e.target.value)}
              >
                <option value="all">All Auth Methods</option>
                <option value="google">Google</option>
                <option value="email/password">Email / Password</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          {/* User Role Table */}
          <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-neutral-400">User Identity</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-400">Email Address</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-400">Role &amp; Security Clearance</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-400">Auth Method</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-400">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-400">Enrolled</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-neutral-400">Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-neutral-400 text-xs">
                        No users found matching current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const isUserSuperAdmin = u.role === "super_admin";
                      const isUserAdmin = u.role === "admin";
                      const isUserVolunteer = u.role === "volunteer";

                      return (
                        <TableRow key={u.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] text-xs">
                          {/* User Identity */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              {u.avatarUrl ? (
                                <div className="relative h-8 w-8 rounded-full overflow-hidden border border-white/10 bg-neutral-900">
                                  <Image src={u.avatarUrl} alt={u.fullName} fill className="object-cover" />
                                </div>
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 border border-white/10 text-neutral-200 font-bold text-xs">
                                  {u.fullName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-neutral-100 flex items-center gap-1.5">
                                  <span>{u.fullName}</span>
                                  {isUserSuperAdmin && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-white/[0.08] text-neutral-200 rounded-full font-mono font-semibold border border-white/15">
                                      OWNER
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-neutral-400">{u.department || "Society Member"}</div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Email */}
                          <TableCell className="text-xs font-mono text-neutral-300">
                            {u.email}
                          </TableCell>

                          {/* Role Badge */}
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${
                                isUserSuperAdmin
                                  ? "bg-white/[0.08] text-neutral-200 border-white/20"
                                  : isUserAdmin
                                  ? "bg-white/[0.04] text-neutral-300 border-white/10"
                                  : "bg-neutral-900 text-neutral-400 border-white/5"
                              }`}
                            >
                              {isUserSuperAdmin && <Crown className="h-2.5 w-2.5 text-neutral-300" />}
                              {getRoleDisplayName(u.role)}
                            </span>
                          </TableCell>

                          {/* Auth Method */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px] border-white/10 text-neutral-300 bg-white/[0.03] rounded-full"
                            >
                              {u.authMethod}
                            </Badge>
                          </TableCell>

                          {/* Account Status */}
                          <TableCell>
                            <span className="inline-flex items-center gap-1 text-[11px] text-neutral-300 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 animate-pulse" />
                              Active
                            </span>
                          </TableCell>

                          {/* Created Date */}
                          <TableCell className="text-[11px] font-mono text-neutral-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </TableCell>

                          {/* Action Button */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEdit(u)}
                                className="h-7 text-xs border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-neutral-200 rounded-full"
                              >
                                <Edit className="h-3 w-3 mr-1 text-neutral-400" />
                                <span>Edit Role</span>
                              </Button>

                              {!isUserSuperAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenDelete({
                                      id: u.id,
                                      fullName: u.fullName,
                                      email: u.email,
                                      role: u.role,
                                    })
                                  }
                                  className="h-7 w-7 p-0 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
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
        </div>
      )}

      {/* ======================= TAB 2: ADMINISTRATORS & CONTACT DIRECTORY ======================= */}
      {activeTab === "admins" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-neutral-300" />
                <span>Executive Council &amp; Administrators</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Authoritative directory of active administrators. Non-admin members do not appear in this list.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={refreshAdminData}
              disabled={loadingContacts}
              className="h-8 text-xs border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white rounded-full"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingContacts ? "animate-spin" : ""}`} />
              <span>Refresh Roster</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminContacts.map((admin) => {
              const isSuper = isSuperAdminEmail(admin.email);

              return (
                <Card
                  key={admin.id}
                  className="glass-panel border border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl relative overflow-hidden transition-all duration-300 hover:border-white/15"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {admin.avatar_url ? (
                          <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/10 bg-neutral-900 shrink-0">
                            <Image src={admin.avatar_url} alt={admin.full_name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center font-bold text-xs text-neutral-200 shrink-0">
                            {admin.full_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-neutral-100 text-xs flex items-center gap-1 truncate">
                            <span className="truncate">{admin.full_name}</span>
                            {isSuper && <Crown className="h-3 w-3 text-neutral-300 shrink-0" />}
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate">{admin.specialty || admin.department}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="admin"
                          className="text-[10px] capitalize border-white/10 bg-white/[0.05] text-neutral-300 rounded-full"
                        >
                          {isSuper ? "Super Admin" : "Administrator"}
                        </Badge>

                        {!isSuper && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleOpenDelete({
                                id: admin.id,
                                fullName: admin.full_name,
                                email: admin.email,
                                role: admin.role,
                              })
                            }
                            className="h-7 w-7 p-0 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                            title="Delete Administrator"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center gap-2 text-neutral-300">
                        <Mail className="h-3 w-3 text-neutral-400 shrink-0" />
                        <span className="font-mono text-[11px] truncate">{admin.email}</span>
                      </div>
                      {(admin as any).phone && (
                        <div className="flex items-center gap-2 text-neutral-300">
                          <Phone className="h-3 w-3 text-neutral-400 shrink-0" />
                          <span className="text-[11px]">{(admin as any).phone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================= TAB 3: AUDIT LOGS & TRANSFERS ======================= */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                <History className="h-5 w-5 text-neutral-400" />
                <span>Security Audit Log</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Immutable audit trail of all role elevations, demotions, and Super Admin transfers.
              </p>
            </div>
          </div>

          <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-neutral-400">Timestamp</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-400">Action Type</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-400">Performed By</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-400">Target User</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-400">Previous Role</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-400">New Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-neutral-400 text-xs">
                        No historical role modifications or transfers recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] text-xs">
                        <TableCell className="font-mono text-neutral-400 text-[11px]">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-white/[0.04] text-neutral-300 border-white/10 rounded-full font-medium text-[10px]"
                          >
                            {log.action_type === "SUPER_ADMIN_TRANSFER" ? "Super Admin Transfer" : "Role Change"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-neutral-300 text-[11px]">
                          {log.performed_by_email}
                        </TableCell>
                        <TableCell className="font-mono text-neutral-200 text-[11px]">
                          {log.target_user_email}
                        </TableCell>
                        <TableCell className="capitalize text-neutral-400">
                          {log.previous_role}
                        </TableCell>
                        <TableCell className="capitalize font-semibold text-neutral-200">
                          {log.new_role}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================= DIALOG 1: EDIT ROLE MODAL ======================= */}
      <Dialog open={!!editTarget} onOpenChange={(op) => !op && setEditTarget(null)}>
        <DialogContent className="max-w-md bg-[#0D0D0D] border border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-neutral-300" />
              <span>Edit User Role &amp; Access</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Select the new security and portal authorization level for this account.
            </DialogDescription>
          </DialogHeader>

          {editTarget && (
            <div className="space-y-4 py-2">
              {/* User Summary Box */}
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400">User:</span>
                  <span className="font-semibold text-neutral-200">{editTarget.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Email:</span>
                  <span className="font-mono text-neutral-300">{editTarget.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Current Role:</span>
                  <span className="font-semibold text-neutral-200 uppercase text-[11px]">
                    {getRoleDisplayName(editTarget.role)}
                  </span>
                </div>
              </div>

              {/* Role Select Options */}
              <div className="space-y-2.5">
                {[
                  {
                    role: "member" as UserRole,
                    title: "Official Member",
                    desc: "Active department contributor. No administrative portal login access.",
                    color: "border-white/10",
                  },
                  {
                    role: "admin" as UserRole,
                    title: "Administrator",
                    desc: "Designated Admin approved by Super Admin. Full console access to manage events, registrations, notices, and members.",
                    color: "border-white/10",
                  },
                  {
                    role: "volunteer" as UserRole,
                    title: "Volunteer",
                    desc: "Event volunteer and community contributor supporting society activities.",
                    color: "border-white/10",
                  },
                ].map((item) => (
                  <label
                    key={item.role}
                    onClick={() => setSelectedNewRole(item.role)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      selectedNewRole === item.role
                        ? "bg-white/[0.08] border-white/20 shadow-sm"
                        : "glass-panel border-white/[0.06] bg-black/40 hover:bg-white/[0.03]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="selected_role"
                      checked={selectedNewRole === item.role}
                      onChange={() => setSelectedNewRole(item.role)}
                      className="mt-1 accent-white"
                    />
                    <div className="text-xs space-y-0.5 flex-1">
                      <div className="font-semibold text-neutral-200 flex items-center justify-between">
                        <span>{item.title}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditTarget(null)}
              className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 text-xs hover:bg-white/[0.07]"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleRoleSelectionSubmit}
              className="rounded-full font-semibold text-xs bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================= DIALOG 2: ROLE CHANGE CONFIRMATION ======================= */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md bg-[#0D0D0D] border border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-neutral-300" />
              <span>Change Role?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-300">
              You are about to change <strong className="text-neutral-100">{editTarget?.fullName}</strong>&apos;s role from{" "}
              <strong className="text-neutral-200">{editTarget ? getRoleDisplayName(editTarget.role) : ""}</strong> to{" "}
              <strong className="text-neutral-100">{getRoleDisplayName(selectedNewRole)}</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
              disabled={processing}
              className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 text-xs hover:bg-white/[0.07]"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleConfirmRoleChange}
              disabled={processing}
              className="rounded-full font-semibold text-xs bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]"
            >
              {processing ? "Updating Role..." : "Confirm Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================= DIALOG 3: DELETE ACCOUNT / ADMIN CONFIRMATION ======================= */}
      <Dialog open={!!deleteTarget} onOpenChange={(op) => !op && setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-[#0D0D0D] border border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-red-400 font-bold flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              <span>Remove Account &amp; Access</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Are you sure you want to remove this account? This will revoke access and delete the user from the roster.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="space-y-4 py-2">
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Name:</span>
                  <span className="font-semibold text-neutral-200">{deleteTarget.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Email:</span>
                  <span className="font-mono text-neutral-300">{deleteTarget.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Current Role:</span>
                  <span className="font-medium capitalize text-neutral-200">{deleteTarget.role}</span>
                </div>
              </div>

              <div className="p-3 bg-red-500/[0.08] border border-red-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-red-300">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  This will permanently remove the user from the administrator directory and user database.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 text-xs hover:bg-white/[0.07]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={processing}
              className="rounded-full font-semibold text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              {processing ? "Removing..." : "Confirm & Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================= DIALOG 4: APPOINT ADMINISTRATOR MODAL ======================= */}
      <Dialog open={showAppointModal} onOpenChange={setShowAppointModal}>
        <DialogContent className="max-w-md bg-[#0D0D0D] border border-white/10 rounded-3xl">
          <form onSubmit={handleAppointAdminSubmit}>
            <DialogHeader>
              <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-neutral-300" />
                <span>Appoint New Administrator</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">
                Grant full Administrator clearance to a user. Appointed admins can immediately log in and manage the society portal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4">
              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-300">Full Name</label>
                <Input
                  placeholder="e.g. Priya Sharma"
                  value={appointName}
                  onChange={(e) => setAppointName(e.target.value)}
                  required
                  className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-300">Email Address</label>
                <Input
                  type="email"
                  placeholder="e.g. priya.sharma@gmail.com"
                  value={appointEmail}
                  onChange={(e) => setAppointEmail(e.target.value)}
                  required
                  className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1 text-neutral-300">Department</label>
                  <Input
                    placeholder="e.g. Media & PR"
                    value={appointDept}
                    onChange={(e) => setAppointDept(e.target.value)}
                    className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1 text-neutral-300">Specialty / Title</label>
                  <Input
                    placeholder="e.g. Media Coordinator"
                    value={appointSpecialty}
                    onChange={(e) => setAppointSpecialty(e.target.value)}
                    className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1 text-neutral-300">Initial Password (Optional)</label>
                <Input
                  type="text"
                  placeholder="Default: Admin@2026"
                  value={appointPassword}
                  onChange={(e) => setAppointPassword(e.target.value)}
                  className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Admins can use this password to sign in or register their own password anytime.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAppointModal(false)}
                className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 text-xs hover:bg-white/[0.07]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={appointLoading}
                className="rounded-full font-semibold text-xs bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm"
              >
                {appointLoading ? "Appointing..." : "Confirm & Appoint"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


