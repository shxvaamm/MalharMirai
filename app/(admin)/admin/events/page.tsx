"use client";

import * as React from "react";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  Search,
  CheckCircle,
  Sparkles,
  Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { useToast } from "@/components/ui/toast";
import {
  CreateEventDialog,
  EditEventDialog,
} from "@/components/admin/event-dialogs";
import { DeleteConfirmDialog } from "@/components/admin/member-dialogs";
import { deleteEventAction } from "@/lib/actions/events";
import { ClubEvent } from "@/lib/mock-data";
import { getEffectiveEventStatus } from "@/lib/utils";

export default function AdminEventsPage() {
  const {
    events,
    registrations,
    addEventToState,
    updateEvent,
    deleteEvent,
    exportRegistrationsCSV,
    loading,
    eventsOrganisedCount,
  } = useAdminData();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editEvent, setEditEvent] = React.useState<ClubEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ClubEvent | null>(null);
  const [selectedRegistrantsEvent, setSelectedRegistrantsEvent] = React.useState<ClubEvent | null>(null);

  const filteredEvents = events.filter((ev) => {
    const effectiveStatus = getEffectiveEventStatus(ev);
    const matchStatus = statusFilter === "all" || effectiveStatus === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      ev.title.toLowerCase().includes(q) ||
      ev.category.toLowerCase().includes(q) ||
      ev.venue.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const handleDeleteEvent = async () => {
    if (!deleteTarget) return;

    const targetId = deleteTarget.id;
    const targetTitle = deleteTarget.title;

    deleteEvent(targetId);
    setDeleteTarget(null);

    toast({
      title: "Event Removed",
      description: `"${targetTitle}" deleted.`,
      type: "warning",
    });

    try {
      await deleteEventAction(targetId);
    } catch (e) {
      console.warn("Background event deletion sync:", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-medium mb-2">
            <Calendar className="h-3.5 w-3.5 text-neutral-400" /> Events &amp; Showcases
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
            Event <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Schedule cultural showcases, monitor live registration numbers, and manage event quotas.
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 shadow-sm rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]"
        >
          <Plus className="h-4 w-4" />
          <span>Create Event</span>
        </Button>
      </div>

      {/* Live Event Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl p-5 shadow-xl hover:border-white/15 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Events Organised
            </CardTitle>
            <Calendar className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <div className="text-2xl sm:text-3xl font-bold text-neutral-100 font-mono">
              {eventsOrganisedCount ?? events.length}
            </div>
            <p className="text-[11px] text-neutral-400 font-medium mt-1">
              Live count synced across public website
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl p-5 shadow-xl hover:border-white/15 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Upcoming Showcases
            </CardTitle>
            <Clock className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <div className="text-2xl sm:text-3xl font-bold text-neutral-100 font-mono">
              {events.filter((e) => getEffectiveEventStatus(e) === "upcoming").length}
            </div>
            <p className="text-[11px] text-neutral-400 font-medium mt-1">
              Currently accepting registrations
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl p-5 shadow-xl hover:border-white/15 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Total Quota Allocated
            </CardTitle>
            <Users className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <div className="text-2xl sm:text-3xl font-bold text-neutral-100 font-mono">
              {events.reduce((acc, e) => acc + (e.max_capacity || 0), 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-neutral-400 font-medium mt-1">
              Campus attendee capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search events by title, department, venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-10 rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                className="flex h-10 rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-medium text-neutral-200 focus-visible:outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading && filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              <p className="text-xs text-neutral-400">Loading events from database...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-neutral-400">Event Title</TableHead>
                  <TableHead className="text-neutral-400">Category</TableHead>
                  <TableHead className="text-neutral-400">Status</TableHead>
                  <TableHead className="text-neutral-400">Date &amp; Venue</TableHead>
                  <TableHead className="text-neutral-400">Dynamic Registrations</TableHead>
                  <TableHead className="text-right text-neutral-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-neutral-400 text-xs">
                      No events found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((ev) => {
                    const eventRegistrations = registrations.filter((r) => r.event_id === ev.id);
                    const registered = eventRegistrations.length;
                    const maxCap = ev.max_capacity || 300;
                    const percent = Math.min(100, Math.round((registered / maxCap) * 100));

                    const effectiveStatus = getEffectiveEventStatus(ev);
                    const isClosed =
                      effectiveStatus === "completed" ||
                      (ev.registration_deadline
                        ? new Date(ev.registration_deadline).getTime() < Date.now()
                        : false);

                    return (
                      <TableRow key={ev.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                        <TableCell>
                          <div className="font-semibold text-neutral-100 text-xs">{ev.title}</div>
                          <div className="text-[11px] text-neutral-400 line-clamp-1 max-w-xs">
                            {ev.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="member" className="text-[10px]">
                            {ev.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={effectiveStatus as "upcoming" | "ongoing" | "completed"}
                            className="capitalize text-[10px]"
                          >
                            {effectiveStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-neutral-400">
                          <div>
                            {new Date(ev.date_time).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-neutral-300 font-medium">{ev.venue}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="space-y-1 w-40">
                            <button
                              type="button"
                              onClick={() => setSelectedRegistrantsEvent(ev)}
                              className="group w-full flex items-center justify-between text-[11px] font-mono px-2 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 transition-colors text-left"
                              title="Click to view registrant details (Name + Email)"
                            >
                              <span className="text-neutral-200 font-bold group-hover:text-emerald-400 flex items-center gap-1.5 transition-colors">
                                <Users className="h-3 w-3 text-neutral-400 group-hover:text-emerald-400 shrink-0" />
                                {registered} registered
                              </span>
                              {isClosed ? (
                                <span className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-black/60 text-neutral-400 border border-white/10 font-semibold">
                                  Closed
                                </span>
                              ) : (
                                <span className="text-[10px] text-neutral-500 font-normal">/ {maxCap}</span>
                              )}
                            </button>
                            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isClosed
                                    ? "bg-neutral-600"
                                    : percent >= 90
                                    ? "bg-rose-500"
                                    : "bg-[#E5E5E5]"
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditEvent(ev)}
                              className="h-8 px-2 text-xs text-neutral-400 hover:text-neutral-200 rounded-full"
                              title="Edit Event"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(ev)}
                              className="h-8 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-full"
                              title="Delete Event"
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
          )}
        </CardContent>
      </Card>


      {/* Dialogs */}
      <CreateEventDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={(newEvent) => {
          addEventToState(newEvent);
          toast({
            title: "Event Published",
            description: `"${newEvent.title}" is now live and accepting registrations.`,
            type: "success",
          });
        }}
        onError={(err) => {
          toast({
            title: "Creation Failed",
            description: err,
            type: "error",
          });
        }}
      />

      <EditEventDialog
        event={editEvent}
        open={!!editEvent}
        onOpenChange={(op) => !op && setEditEvent(null)}
        onSuccess={(updated) => {
          updateEvent(updated.id, updated);
          toast({
            title: "Event Updated",
            description: `"${updated.title}" records saved.`,
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

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(op) => !op && setDeleteTarget(null)}
        title="Delete Event"
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}"?`}
        onConfirm={handleDeleteEvent}
      />

      {/* Registrant List Modal (Admin Only - Name & Email Record) */}
      <Dialog
        open={!!selectedRegistrantsEvent}
        onOpenChange={(open) => !open && setSelectedRegistrantsEvent(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-white/[0.08] bg-[#0D0D0D]/95 backdrop-blur-2xl text-neutral-200 p-6">
          <DialogHeader className="space-y-1.5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <Badge variant="member" className="text-xs">
                {selectedRegistrantsEvent?.category}
              </Badge>
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20">
                {selectedRegistrantsEvent
                  ? registrations.filter((r) => r.event_id === selectedRegistrantsEvent.id).length
                  : 0}{" "}
                Registered
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-neutral-100">
              {selectedRegistrantsEvent?.title} — Registrants
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Verified attendee records sourced live from the Supabase registrations table.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2">
            {(() => {
              const list = selectedRegistrantsEvent
                ? registrations.filter((r) => r.event_id === selectedRegistrantsEvent.id)
                : [];
              if (list.length === 0) {
                return (
                  <div className="py-12 text-center text-xs text-neutral-500">
                    No student registrations found for this event yet.
                  </div>
                );
              }
              return (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                      <TableHead className="text-neutral-400 text-xs w-12">#</TableHead>
                      <TableHead className="text-neutral-400 text-xs">Attendee Name</TableHead>
                      <TableHead className="text-neutral-400 text-xs">Email</TableHead>
                      <TableHead className="text-neutral-400 text-xs">Registered Date</TableHead>
                      <TableHead className="text-right text-neutral-400 text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((reg, idx) => (
                      <TableRow key={reg.id || idx} className="border-b border-white/[0.04]">
                        <TableCell className="text-xs font-mono text-neutral-500">{idx + 1}</TableCell>
                        <TableCell className="text-xs font-medium text-neutral-100">{reg.student_name}</TableCell>
                        <TableCell className="text-xs font-mono text-neutral-300">{reg.student_email}</TableCell>
                        <TableCell className="text-xs text-neutral-400">
                          {new Date(reg.created_at || reg.registered_at || Date.now()).toLocaleDateString("en-IN", {
                            dateStyle: "medium",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="upcoming" className="text-[10px] capitalize">
                            {reg.status || "confirmed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedRegistrantsEvent) {
                  exportRegistrationsCSV(selectedRegistrantsEvent.id);
                }
              }}
              className="rounded-full text-xs border-white/10 hover:bg-white/[0.06] flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRegistrantsEvent(null)}
              className="rounded-full text-xs text-neutral-400"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
