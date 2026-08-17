"use client";

import * as React from "react";
import {
  MessageSquare,
  Bell,
  AlertTriangle,
  Send,
  MailCheck,
  Plus,
  Trash2,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { useToast } from "@/components/ui/toast";
import { DraftNoticeDialog, EmailBlastDialog } from "@/components/admin/notice-dialogs";
import { DeleteConfirmDialog } from "@/components/admin/member-dialogs";
import { deleteAnnouncementAction } from "@/lib/actions/announcements";
import { Announcement } from "@/lib/mock-data";

export default function AdminCommunicationPage() {
  const {
    announcements,
    events,
    addAnnouncementToState,
    deleteAnnouncement,
    toggleEmergencyBanner,
  } = useAdminData();
  const { toast } = useToast();

  const [draftOpen, setDraftOpen] = React.useState(false);
  const [emailBlastOpen, setEmailBlastOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Announcement | null>(null);

  const activeEmergency = announcements.find((a) => a.is_emergency);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
            Communication &amp; <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Notice Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Publish site-wide circulars, manage the emergency alert top banner, and dispatch email blasts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEmailBlastOpen(true)}
            className="rounded-full border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07]"
          >
            <MailCheck className="mr-1.5 h-4 w-4 text-neutral-400" />
            <span>Email Blast</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setDraftOpen(true)}
            className="flex items-center gap-1.5 shadow-sm rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]"
          >
            <Plus className="h-4 w-4" />
            <span>Post Notice</span>
          </Button>
        </div>
      </div>

      {/* Emergency Alert Banner Status Card */}
      <Card className={`glass-panel border rounded-3xl shadow-xl transition-all ${
        activeEmergency
          ? "border-rose-500/50 bg-rose-950/20"
          : "border-white/[0.06] bg-[#0D0D0D]/75"
      }`}>
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-2xl ${
              activeEmergency ? "bg-rose-500/20 text-rose-400" : "bg-white/[0.04] border border-white/10 text-neutral-300"
            }`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-neutral-100">Emergency Top Banner System</h3>
                <Badge variant={activeEmergency ? "destructive" : "secondary"} className="text-[10px] rounded-full">
                  {activeEmergency ? "Broadcasting Live" : "Standby"}
                </Badge>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
                {activeEmergency
                  ? `Active Announcement: "${activeEmergency.title}" is currently pinned to the top of all public pages.`
                  : "No emergency broadcast is currently pinned. You can toggle any urgent notice to appear as a high-visibility header banner."}
              </p>
            </div>
          </div>

          {activeEmergency && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await toggleEmergencyBanner(activeEmergency.id);
                toast({
                  title: "Emergency Banner Deactivated",
                  description: "Top banner removed from public pages.",
                });
              }}
              className="text-xs text-rose-300 border-rose-500/40 hover:bg-rose-500/10 shrink-0 rounded-full"
            >
              Deactivate Banner
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Announcements Table */}
      <Card className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 rounded-3xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold text-neutral-100">Published Circulars &amp; Notice Feed</CardTitle>
          <CardDescription className="text-xs text-neutral-400">
            Official announcements displayed on the public /announcements page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-neutral-400">Notice Title</TableHead>
                <TableHead className="text-neutral-400">Priority</TableHead>
                <TableHead className="text-neutral-400">Emergency Banner</TableHead>
                <TableHead className="text-neutral-400">Date Published</TableHead>
                <TableHead className="text-right text-neutral-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((ann) => (
                <TableRow key={ann.id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="font-semibold text-neutral-100 text-xs">{ann.title}</div>
                    <div className="text-[11px] text-neutral-400 line-clamp-1 max-w-md">
                      {ann.content}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ann.priority === "urgent" ? "urgent" : "secondary"}
                      className="text-[10px] capitalize rounded-full"
                    >
                      {ann.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleEmergencyBanner(ann.id);
                        toast({
                          title: !ann.is_emergency ? "Emergency Banner Activated" : "Emergency Banner Removed",
                          description: ann.title,
                          type: !ann.is_emergency ? "warning" : "info",
                        });
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                        ann.is_emergency
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/50"
                          : "border border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {ann.is_emergency ? "Enabled (Live)" : "Set as Emergency"}
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-neutral-400 font-mono">
                    {new Date(ann.created_at).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(ann)}
                      className="h-8 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-full"
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


      {/* Dialogs */}
      <DraftNoticeDialog
        open={draftOpen}
        onOpenChange={setDraftOpen}
        onPost={async (title, content, priority, isEmergency, id) => {
          addAnnouncementToState({
            id: id || `ann-${Date.now()}`,
            title,
            content,
            priority,
            is_emergency: isEmergency,
            created_at: new Date().toISOString(),
          });
          toast({
            title: isEmergency ? "Emergency Notice Broadcasted" : "Notice Published",
            description: title,
            type: isEmergency ? "warning" : "success",
          });
        }}
      />

      <EmailBlastDialog
        events={events}
        open={emailBlastOpen}
        onOpenChange={setEmailBlastOpen}
        onSend={async (target, subject, body) => {
          toast({
            title: "Email Dispatch Initiated",
            description: `Queued dispatch for "${subject}" to registered students.`,
          });
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(op) => !op && setDeleteTarget(null)}
        title="Delete Announcement"
        description={`Remove notice "${deleteTarget?.title}" from circular board?`}
        onConfirm={async () => {
          if (deleteTarget) {
            const res = await deleteAnnouncementAction(deleteTarget.id);
            if (res.success) {
              deleteAnnouncement(deleteTarget.id);
              toast({ title: "Notice Deleted", description: "Announcement removed from Supabase.", type: "warning" });
            } else {
              toast({ title: "Deletion Failed", description: res.error || "Could not delete notice.", type: "error" });
            }
          }
        }}
      />
    </div>
  );
}
