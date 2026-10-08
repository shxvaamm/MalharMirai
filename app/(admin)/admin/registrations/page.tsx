"use client";

import * as React from "react";
import {
  ClipboardList,
  Download,
  Search,
  Trash2,
  Calendar,
  Users,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  X,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAdminData, StudentRegistration } from "@/lib/hooks/use-admin-data";
import { useToast } from "@/components/ui/toast";
import { DeleteConfirmDialog } from "@/components/admin/member-dialogs";
import {
  cancelRegistrationAction,
  updateRegistrationStatusAction,
} from "@/lib/actions/registrations";

export default function AdminRegistrationsPage() {
  const {
    events,
    registrations,
    deleteRegistration,
    confirmRegistration,
    rejectRegistration,
    exportRegistrationsCSV,
  } = useAdminData();
  const { toast } = useToast();

  const [selectedEventId, setSelectedEventId] = React.useState("all");
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [filterType, setFilterType] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modals state
  const [deleteTarget, setDeleteTarget] = React.useState<StudentRegistration | null>(null);
  const [reviewTarget, setReviewTarget] = React.useState<StudentRegistration | null>(null);
  const [issueReason, setIssueReason] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  // Filtered registrations
  const filteredRegistrations = registrations.filter((r) => {
    const matchEvent = selectedEventId === "all" || r.event_id === selectedEventId;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "pending" && r.status !== "confirmed" && r.status !== "rejected") ||
      r.status === filterStatus;
    const matchType =
      filterType === "all" || (r.registration_type || "individual") === filterType;

    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      r.student_name.toLowerCase().includes(q) ||
      r.student_email.toLowerCase().includes(q) ||
      (r.account_email && r.account_email.toLowerCase().includes(q)) ||
      (r.team_name && r.team_name.toLowerCase().includes(q)) ||
      (r.ticket_code && r.ticket_code.toLowerCase().includes(q)) ||
      r.event_title.toLowerCase().includes(q) ||
      (r.department && r.department.toLowerCase().includes(q));

    return matchEvent && matchStatus && matchType && matchQuery;
  });

  // Capacity and counts
  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const totalSlots =
    selectedEventId === "all"
      ? events.reduce((acc, e) => acc + (e.max_capacity || 300), 0)
      : selectedEvent?.max_capacity || 300;

  const eventRegs =
    selectedEventId === "all"
      ? registrations
      : registrations.filter((r) => r.event_id === selectedEventId);

  const totalRegistered = eventRegs.length;
  const confirmedCount = eventRegs.filter((r) => r.status === "confirmed").length;
  const pendingCount = eventRegs.filter(
    (r) => r.status !== "confirmed" && r.status !== "rejected"
  ).length;

  const handleExport = () => {
    exportRegistrationsCSV(selectedEventId);
    toast({
      title: "Export Generated",
      description: "CSV participant manifest downloaded successfully.",
    });
  };

  // Confirm registration
  const handleConfirmRsvp = async (reg: StudentRegistration) => {
    setActionLoading(true);
    try {
      const res = await updateRegistrationStatusAction(reg.id, "confirmed");
      if (res.success) {
        confirmRegistration(reg.id);
        toast({
          title: "Registration Confirmed!",
          description: `Digital entry pass issued for "${reg.student_name}".`,
        });
        setReviewTarget(null);
      } else {
        toast({
          title: "Update Failed",
          description: res.error || "Failed to confirm registration.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to confirm registration.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Reject registration & restore slot capacity
  const handleRejectRsvp = async (reg: StudentRegistration) => {
    setActionLoading(true);
    const reason = issueReason.trim() || "Payment could not be verified by admin.";
    try {
      const res = await updateRegistrationStatusAction(reg.id, "rejected", reason);
      if (res.success) {
        rejectRegistration(reg.id, reason);
        toast({
          title: "Application Declined",
          description: `Application rejected. Reserved seat capacity has been restored.`,
        });
        setReviewTarget(null);
        setIssueReason("");
      } else {
        toast({
          title: "Update Failed",
          description: res.error || "Failed to decline registration.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to decline registration.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete registration permanently
  const handleCancelRegistration = async () => {
    if (!deleteTarget) return;

    const result = await cancelRegistrationAction(deleteTarget.id);
    if (result.success) {
      deleteRegistration(deleteTarget.id);
      toast({
        title: "Registration Revoked",
        description: `Pass for "${deleteTarget.student_name}" removed.`,
      });
    } else {
      deleteRegistration(deleteTarget.id);
      toast({
        title: "Registration Removed",
        description: `Slot for "${deleteTarget.student_name}" freed.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-medium mb-2">
            <ClipboardList className="h-3.5 w-3.5 text-neutral-400" />
            <span>Live Registration &amp; Ticketing Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
            Event{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">
              Registrations &amp; Verification
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Review UPI payment receipts, confirm digital entry passes, and manage attendees.
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={handleExport}
          className="flex items-center gap-1.5 shadow-sm rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV Manifest</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0D0D0D]/75 border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium">Total Registered</p>
              <h3 className="text-2xl font-bold text-white">{totalRegistered}</h3>
            </div>
          </div>
        </Card>

        <Card className="bg-[#0D0D0D]/75 border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium">Confirmed Passes</p>
              <h3 className="text-2xl font-bold text-emerald-400">{confirmedCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="bg-[#0D0D0D]/75 border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium">Pending Audit</p>
              <h3 className="text-2xl font-bold text-amber-300">{pendingCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="bg-[#0D0D0D]/75 border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium">Slots Remaining</p>
              <h3 className="text-2xl font-bold text-white">
                {Math.max(0, totalSlots - totalRegistered)}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search attendee, team, email, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-10 rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Event Filter */}
              <select
                className="h-10 rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-medium text-neutral-200 focus:outline-none"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                <option value="all">All Events ({events.length})</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                className="h-10 rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-medium text-neutral-200 focus:outline-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Verification</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Type Filter */}
              <select
                className="h-10 rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-medium text-neutral-200 focus:outline-none"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="individual">Solo / Individual</option>
                <option value="team">Team / Group</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="w-full overflow-x-auto custom-scrollbar pb-2">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-neutral-400 min-w-[220px]">Applicant / Team</TableHead>
                  <TableHead className="text-neutral-400 min-w-[140px]">Type &amp; Roster</TableHead>
                  <TableHead className="text-neutral-400 min-w-[180px]">Event Title</TableHead>
                  <TableHead className="text-neutral-400 min-w-[180px]">Custom Answer</TableHead>
                  <TableHead className="text-neutral-400 min-w-[140px]">Payment Proof</TableHead>
                  <TableHead className="text-neutral-400 min-w-[130px]">Status</TableHead>
                  <TableHead className="text-right text-neutral-400 min-w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-neutral-500 text-xs">
                      No registrations match your active filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((reg) => {
                    const isConfirmed = reg.status === "confirmed";
                    const isRejected = reg.status === "rejected";
                    const isPending = !isConfirmed && !isRejected;

                    return (
                      <TableRow
                        key={reg.id}
                        className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Applicant Name & Email */}
                        <TableCell>
                          <div className="font-semibold text-neutral-100 text-xs">
                            {reg.registration_type === "team" && reg.team_name ? (
                              <span>
                                {reg.team_name}
                                <span className="block text-[11px] text-neutral-400 font-normal">
                                  Lead: {reg.student_name}
                                </span>
                              </span>
                            ) : (
                              reg.student_name
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            {reg.student_email}
                          </div>
                          {reg.account_email && reg.account_email !== reg.student_email && (
                            <div className="text-[10px] text-neutral-400 font-mono truncate max-w-[200px]" title={`Account: ${reg.account_email}`}>
                              <span className="text-neutral-500">Acc:</span> {reg.account_email}
                            </div>
                          )}
                          <div className="text-[10px] text-amber-400/80 font-mono">
                            {reg.ticket_code || `#${reg.id.slice(0, 8)}`}
                          </div>
                        </TableCell>

                        {/* Type & Roster */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-bold border-white/10 ${
                                reg.registration_type === "team"
                                  ? "bg-amber-500/10 text-amber-300"
                                  : "text-neutral-300"
                              }`}
                            >
                              {reg.registration_type || "individual"}
                            </Badge>
                            {reg.registration_type === "team" && Array.isArray(reg.team_members) && (
                              <span className="text-[11px] text-neutral-400">
                                ({reg.team_members.length + 1} mem)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-1">
                            {reg.department || "General"} {reg.year ? `• ${reg.year}` : ""}
                          </div>
                        </TableCell>

                        {/* Event Title */}
                        <TableCell>
                          <Badge variant="outline" className="text-[11px] border-white/10 text-neutral-200">
                            {reg.event_title}
                          </Badge>
                        </TableCell>

                        {/* Custom Answer / Tracks */}
                        <TableCell>
                          <div className="text-xs text-neutral-300 max-w-[200px] truncate" title={reg.custom_answer || ""}>
                            {reg.custom_answer || <span className="text-neutral-500 italic">None</span>}
                          </div>
                          {Array.isArray(reg.selected_options) && reg.selected_options.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {reg.selected_options.map((opt: string) => (
                                <span
                                  key={opt}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/5"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </TableCell>

                        {/* Payment Screenshot */}
                        <TableCell>
                          {reg.payment_screenshot ? (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewTarget(reg);
                                setIssueReason(reg.issue_reason || "");
                              }}
                              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>View Receipt</span>
                            </button>
                          ) : (
                            <span className="text-xs text-neutral-500">Free / No proof</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                              isConfirmed
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isRejected
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            }`}
                          >
                            {isConfirmed ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : isRejected ? (
                              <XCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            <span>{reg.status || "Pending"}</span>
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <Button
                                variant="default"
                                size="sm"
                                disabled={actionLoading}
                                onClick={() => handleConfirmRsvp(reg)}
                                className="h-8 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm flex items-center gap-1 px-2.5"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Approve Pass</span>
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReviewTarget(reg);
                                setIssueReason(reg.issue_reason || "");
                              }}
                              className="h-8 rounded-xl text-xs font-semibold border-white/10 hover:bg-white/[0.06] text-neutral-200"
                            >
                              Audit / Review
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(reg)}
                              className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl"
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
          </div>
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* REVIEW APPLICATION & PAYMENT SCREENSHOT MODAL            */}
      {/* ========================================================= */}
      {reviewTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setReviewTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full bg-[#0D0D0D] border border-white/15 rounded-3xl p-6 shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 space-y-4"
          >
            <button
              onClick={() => setReviewTarget(null)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-1">
                Application Review
              </span>
              <h2 className="text-lg font-bold text-neutral-100">
                Audit Registration: {reviewTarget.team_name || reviewTarget.student_name}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Event: <strong className="text-neutral-200">{reviewTarget.event_title}</strong>
              </p>
            </div>

            {/* Applicant Summary */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-400">Applicant:</span>
                <span className="font-semibold text-neutral-200">{reviewTarget.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Email:</span>
                <span className="text-neutral-300">{reviewTarget.student_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Roll No / ID:</span>
                <span className="font-mono text-neutral-300">{reviewTarget.college_id || "N/A"}</span>
              </div>
              {reviewTarget.registration_type === "team" && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Team Name:</span>
                  <span className="font-semibold text-amber-300">{reviewTarget.team_name}</span>
                </div>
              )}
              {reviewTarget.custom_answer && (
                <div className="pt-1.5 border-t border-white/5">
                  <span className="text-neutral-400 block text-[11px]">Custom Answer:</span>
                  <p className="text-neutral-200 text-xs mt-0.5 italic">{reviewTarget.custom_answer}</p>
                </div>
              )}
            </div>

            {/* Payment Screenshot Preview */}
            {reviewTarget.payment_screenshot ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300">UPI Payment Screenshot</span>
                  <a
                    href={reviewTarget.payment_screenshot}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Open Full Image
                  </a>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/60 p-2 flex items-center justify-center max-h-56 overflow-hidden">
                  <img
                    src={reviewTarget.payment_screenshot}
                    alt="Payment Screenshot"
                    className="max-h-52 w-auto object-contain rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-neutral-400 text-center">
                Free Registration • No Payment Receipt Attached
              </div>
            )}

            {/* Rejection Reason Input */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Rejection Note / Reason <span className="text-neutral-500 font-normal">(Required only if rejecting)</span>
              </label>
              <Input
                placeholder="e.g. Transaction ID could not be found / Receipt unclear"
                value={issueReason}
                onChange={(e) => setIssueReason(e.target.value)}
                className="text-xs rounded-xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleRejectRsvp(reviewTarget)}
                disabled={actionLoading}
                className="flex-1 rounded-2xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs font-bold py-2.5"
              >
                {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                <span>Reject &amp; Free Slot</span>
              </Button>

              <Button
                type="button"
                variant="default"
                onClick={() => handleConfirmRsvp(reviewTarget)}
                disabled={actionLoading}
                className="flex-1 rounded-2xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-2.5 shadow-lg flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                <span>Confirm &amp; Issue Pass</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Revoke Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(op) => !op && setDeleteTarget(null)}
        title="Revoke Registration"
        description={`Cancel ${deleteTarget?.student_name}'s registration for "${deleteTarget?.event_title}"?`}
        onConfirm={handleCancelRegistration}
      />
    </div>
  );
}
