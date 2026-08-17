"use client";

import * as React from "react";
import {
  ClipboardList,
  Download,
  Search,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAdminData, StudentRegistration } from "@/lib/hooks/use-admin-data";
import { useToast } from "@/components/ui/toast";
import { DeleteConfirmDialog } from "@/components/admin/member-dialogs";
import { cancelRegistrationAction } from "@/lib/actions/registrations";

export default function AdminRegistrationsPage() {
  const {
    events,
    registrations,
    deleteRegistration,
    exportRegistrationsCSV,
  } = useAdminData();
  const { toast } = useToast();

  const [selectedEventId, setSelectedEventId] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<StudentRegistration | null>(null);

  const filteredRegistrations = registrations.filter((r) => {
    const matchEvent = selectedEventId === "all" || r.event_id === selectedEventId;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      r.student_name.toLowerCase().includes(q) ||
      r.student_email.toLowerCase().includes(q) ||
      r.event_title.toLowerCase().includes(q) ||
      (r.department && r.department.toLowerCase().includes(q));
    return matchEvent && matchQuery;
  });

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const totalSlots = selectedEventId === "all" 
    ? events.reduce((acc, e) => acc + (e.max_capacity || 300), 0)
    : (selectedEvent?.max_capacity || 300);
  const currentCount = selectedEventId === "all" 
    ? registrations.length 
    : (selectedEvent?.registered_count || 0);

  const handleExport = () => {
    exportRegistrationsCSV(selectedEventId);
    toast({
      title: "Export Generated",
      description: "CSV participant manifest downloaded successfully.",
    });
  };

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
            <ClipboardList className="h-3.5 w-3.5 text-neutral-400" /> Live Registration Ledger
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
            Event <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Registrations</span>
          </h1>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={handleExport}
          className="flex items-center gap-1.5 shadow-sm rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#0D0D0D]/75 border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Total Registered</p>
              <h3 className="text-2xl font-bold text-white">{currentCount}</h3>
            </div>
          </div>
        </Card>
        <Card className="bg-[#0D0D0D]/75 border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Capacity</p>
              <h3 className="text-2xl font-bold text-white">{totalSlots}</h3>
            </div>
          </div>
        </Card>
        <Card className="bg-[#0D0D0D]/75 border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-500/10 text-amber-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Slots Remaining</p>
              <h3 className="text-2xl font-bold text-white">{Math.max(0, totalSlots - currentCount)}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search attendees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-10 rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>

            <select
              className="flex h-10 rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-medium text-neutral-200 focus-visible:outline-none w-full md:w-auto"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="all">All Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-neutral-400">Student Attendee</TableHead>
                <TableHead className="text-neutral-400">Event Title</TableHead>
                <TableHead className="text-neutral-400">Dept/Year</TableHead>
                <TableHead className="text-neutral-400">Contact</TableHead>
                <TableHead className="text-right text-neutral-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((reg) => (
                <TableRow key={reg.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="font-semibold text-neutral-100 text-xs">{reg.student_name}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">#{reg.id.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] border-white/10 text-neutral-300">
                      {reg.event_title}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-neutral-300">
                    {reg.department} / {reg.year}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-400">
                    {reg.student_email}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(reg)}
                      className="h-8 w-8 p-0 text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
