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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { useToast } from "@/components/ui/toast";
import {
  CreateEventDialog,
  EditEventDialog,
} from "@/components/admin/event-dialogs";
import { DeleteConfirmDialog } from "@/components/admin/member-dialogs";
import { deleteEventAction } from "@/lib/actions/events";
import { ClubEvent } from "@/lib/mock-data";

export default function AdminEventsPage() {
  const {
    events,
    stats,
    updateStats,
    addEventToState,
    updateEvent,
    deleteEvent,
    loading,
  } = useAdminData();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editEvent, setEditEvent] = React.useState<ClubEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ClubEvent | null>(null);

  // Events count inline quick edit
  const [isEditingEventsCount, setIsEditingEventsCount] = React.useState(false);
  const [eventsCountInput, setEventsCountInput] = React.useState(stats?.eventsOrganised || events.length || 12);

  React.useEffect(() => {
    if (stats?.eventsOrganised !== undefined) {
      setEventsCountInput(stats.eventsOrganised);
    } else {
      setEventsCountInput(events.length || 12);
    }
  }, [stats?.eventsOrganised, events.length]);

  const handleSaveEventsCount = () => {
    const val = Number(eventsCountInput) >= 0 ? Number(eventsCountInput) : 0;
    updateStats({ eventsOrganised: val });
    setIsEditingEventsCount(false);
    toast({
      title: "Events Organised Metric Updated",
      description: `Public website events organised metric set to ${val}.`,
      type: "success",
    });
  };

  const filteredEvents = events.filter((ev) => {
    const matchStatus = statusFilter === "all" || ev.status === statusFilter;
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

      {/* Events Organised Metric Control Card */}
      <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 p-5 rounded-3xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/[0.04] border border-white/10 text-neutral-300 flex items-center justify-center font-bold">
              <Calendar className="h-5 w-5 text-neutral-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                <span>Public Display Events Organised:</span>
                <span className="text-base font-bold text-neutral-100 font-mono">
                  {stats?.eventsOrganised !== undefined ? stats.eventsOrganised : (events.length || 12)}+
                </span>
                <Badge variant="upcoming" className="text-[10px]">Real-Time</Badge>
              </div>
              <p className="text-[11px] text-neutral-400">
                Database Events Total: <span className="font-semibold text-neutral-200">{events.length} events scheduled/held</span>
              </p>
            </div>
          </div>

          {!isEditingEventsCount ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingEventsCount(true)}
                className="border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07] rounded-full text-xs font-medium"
              >
                Edit Public Events Count
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateStats({ eventsOrganised: events.length });
                  toast({
                    title: "Synced to Events Count",
                    description: `Events organised set to match database total (${events.length}).`,
                    type: "success",
                  });
                }}
                className="text-xs text-neutral-400 hover:text-neutral-200 rounded-full"
                title="Sync with current database count"
              >
                Auto-Sync ({events.length})
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={eventsCountInput}
                onChange={(e) => setEventsCountInput(Number(e.target.value))}
                className="w-20 h-8 text-xs font-mono font-bold bg-neutral-900 border-white/10 text-neutral-100 rounded-xl"
                min={0}
              />
              <Button size="sm" variant="default" onClick={handleSaveEventsCount} className="h-8 rounded-full text-xs font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]">
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingEventsCount(false)} className="h-8 text-xs text-neutral-400 rounded-full">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>

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
                    const registered = ev.registered_count || 0;
                    const maxCap = ev.max_capacity || 300;
                    const percent = Math.min(100, Math.round((registered / maxCap) * 100));

                    const isPast =
                      ev.status === "completed" ||
                      new Date(ev.date_time).getTime() < Date.now();
                    const isDeadlinePassed = ev.registration_deadline
                      ? new Date(ev.registration_deadline).getTime() < Date.now()
                      : false;
                    const isClosed = isPast || isDeadlinePassed;

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
                            variant={ev.status as "upcoming" | "ongoing" | "completed"}
                            className="capitalize text-[10px]"
                          >
                            {ev.status}
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
                          <div className="space-y-1 w-36">
                            <div className="flex justify-between items-center text-[11px] font-mono">
                              <span className="text-neutral-200 font-bold">{registered} / {maxCap}</span>
                              {isClosed ? (
                                <span className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-white/10 font-semibold">
                                  Closed
                                </span>
                              ) : (
                                <span className="font-bold text-neutral-400">{percent}%</span>
                              )}
                            </div>
                            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
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
    </div>
  );
}
