"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClubEvent } from "@/lib/mock-data";
import { Bell, Send, AlertTriangle, MailCheck, Loader2 } from "lucide-react";
import { postAnnouncementAction } from "@/lib/actions/announcements";

// ===================== DRAFT NOTICE DIALOG =====================
interface DraftNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPost: (title: string, content: string, priority: "normal" | "urgent", isEmergency: boolean, id?: string) => Promise<any>;
}

export function DraftNoticeDialog({ open, onOpenChange, onPost }: DraftNoticeDialogProps) {
  const [title, setTitle] = React.useState("");
  const [priority, setPriority] = React.useState<"normal" | "urgent">("normal");
  const [isEmergency, setIsEmergency] = React.useState(false);
  const [content, setContent] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await postAnnouncementAction({
      title: title.trim(),
      content: content.trim(),
      priority,
      is_emergency: isEmergency,
    });

    if (result.success && onPost) {
      await onPost(
        title.trim(),
        content.trim(),
        priority,
        isEmergency,
        result.data?.id
      );
    }
    setLoading(false);
    onOpenChange(false);
    setTitle("");
    setContent("");
    setIsEmergency(false);
    setPriority("normal");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-neutral-300" />
            <span>Post New Announcement</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Broadcast a circular or emergency alert to the public website.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Notice Title</label>
            <Input placeholder="e.g. Fest Rehearsals Venue Shift" value={title} onChange={(e) => setTitle(e.target.value)} required className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Priority Level</label>
            <select
              className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 focus-visible:outline-none"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
            >
              <option value="normal">Normal Announcement</option>
              <option value="urgent">Urgent Announcement</option>
            </select>
          </div>

          <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-600/30 flex items-center gap-2.5">
            <input
              type="checkbox"
              id="emergency-flag"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
              className="rounded-md border-rose-500 text-rose-600 focus:ring-rose-500 h-4 w-4"
            />
            <label htmlFor="emergency-flag" className="text-xs font-semibold text-rose-300 cursor-pointer flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Broadcast as Emergency Top Banner</span>
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Content / Circular Details</label>
            <textarea
              className="flex w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 min-h-[90px] focus:outline-none"
              placeholder="Enter full notice body..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={loading} className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {loading ? "Publishing..." : "Broadcast Notice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== EMAIL BLAST DIALOG =====================
interface EmailBlastDialogProps {
  events: ClubEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (targetEventId: string, subject: string, body: string) => Promise<any>;
}

export function EmailBlastDialog({ events, open, onOpenChange, onSend }: EmailBlastDialogProps) {
  const [targetEvent, setTargetEvent] = React.useState("all");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSend(targetEvent, subject, body);
    setLoading(false);
    onOpenChange(false);
    setSubject("");
    setBody("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
            <MailCheck className="h-5 w-5 text-neutral-300" />
            <span>Email Blast to Registered Attendees</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Send instructions, slot timings, or rulebooks directly to student inboxes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Target Audience</label>
            <select
              className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-medium text-neutral-200 focus-visible:outline-none"
              value={targetEvent}
              onChange={(e) => setTargetEvent(e.target.value)}
            >
              <option value="all">All Registered Students (All Events)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.registered_count} Registered)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Email Subject</label>
            <Input placeholder="e.g. Important: Reporting Time & Line-Check for Dhwani 2026" value={subject} onChange={(e) => setSubject(e.target.value)} required className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Email Template Body</label>
            <textarea
              className="flex w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 min-h-[110px] focus:outline-none"
              placeholder="Dear Participant,\n\nPlease note your allocated stage slot..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={loading} className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {loading ? "Sending..." : "Dispatch Email Blast"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
