"use client";

import * as React from "react";
import Image from "next/image";
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
import { ClubEvent, MOCK_DEPARTMENTS } from "@/lib/mock-data";
import {
  Calendar,
  Plus,
  Edit,
  Trophy,
  Award,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  createEventAction,
  updateEventAction,
  assignWinnersAction,
} from "@/lib/actions/events";
import { uploadMediaFile, validateMediaFile } from "@/lib/supabase/storage";

// ===================== CREATE EVENT DIALOG =====================
interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newEvent: ClubEvent) => void;
  onError?: (errorMsg: string) => void;
  onCreate?: (newEvent: any) => Promise<any>;
}

export function CreateEventDialog({
  open,
  onOpenChange,
  onSuccess,
  onError,
  onCreate,
}: CreateEventDialogProps) {
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("Music");
  const [description, setDescription] = React.useState("");
  const [dateTime, setDateTime] = React.useState("2026-11-20T17:00");
  const [venue, setVenue] = React.useState("Main Campus Auditorium");
  const [capacity, setCapacity] = React.useState("400");
  const [status, setStatus] = React.useState<"upcoming" | "ongoing" | "completed">("upcoming");
  const [deadline, setDeadline] = React.useState("2026-11-15T23:59");
  const [posterUrl, setPosterUrl] = React.useState("");

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploadingPoster, setUploadingPoster] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateMediaFile(file);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid file format or size.");
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemovePoster = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPosterUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim() || title.trim().length < 3) {
      setValidationError("Event title must be at least 3 characters.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setValidationError("Description must be at least 10 characters.");
      return;
    }

    setLoading(true);

    let finalPosterUrl = posterUrl.trim() || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80";

    if (selectedFile) {
      setUploadingPoster(true);
      const uploadRes = await uploadMediaFile(selectedFile, "events");
      setUploadingPoster(false);

      if (!uploadRes.success || !uploadRes.url) {
        setLoading(false);
        setValidationError(uploadRes.error || "Failed to upload poster to Supabase Storage.");
        return;
      }
      finalPosterUrl = uploadRes.url;
    }

    const result = await createEventAction({
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      date_time: new Date(dateTime).toISOString(),
      venue: venue.trim(),
      poster_url: finalPosterUrl,
      max_capacity: parseInt(capacity) || 200,
      status,
      registration_deadline: new Date(deadline).toISOString(),
    });
    setLoading(false);

    if (result.success) {
      const createdObj: ClubEvent = {
        id: result.data?.id || `evt-${Date.now()}`,
        title: title.trim(),
        category,
        description: description.trim(),
        date_time: new Date(dateTime).toISOString(),
        venue: venue.trim(),
        poster_url: finalPosterUrl,
        max_capacity: parseInt(capacity) || 200,
        registered_count: 0,
        status,
        registration_deadline: new Date(deadline).toISOString(),
        rules: ["Valid college ID required.", "Report 30 mins early."],
        prizes: ["1st Prize: Champion Trophy", "2nd Prize: Silver Trophy"],
      };

      if (onCreate) {
        await onCreate(createdObj);
      }
      if (onSuccess) {
        onSuccess(createdObj);
      }
      onOpenChange(false);
      setTitle("");
      setDescription("");
      handleRemovePoster();
    } else {
      setValidationError(result.error || "Failed to create event.");
      if (onError) onError(result.error || "Failed to create event.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-neutral-300" />
            <span>Create New Cultural Event</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Schedule a new competition or concert with Supabase poster storage.
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Event Title *</label>
            <Input
              placeholder="e.g. Dhwani: Battle of the Bands"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Wing / Category</label>
              <select
                className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 focus-visible:outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
              >
                <option value="Music">Music &amp; Vocals</option>
                <option value="Dance">Dance &amp; Choreography</option>
                <option value="Dramatic Arts">Dramatic Arts &amp; Theatre</option>
                <option value="Fine Arts">Fine Arts &amp; Design</option>
                <option value="Literary">Literary &amp; Debating</option>
                <option value="General">General Fest Event</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Status</label>
              <select
                className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 focus-visible:outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                disabled={loading}
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing (Live)</option>
                <option value="completed">Completed / Archive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Date &amp; Time</label>
              <Input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
                disabled={loading}
                className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Registration Deadline</label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                disabled={loading}
                className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Venue</label>
              <Input
                placeholder="Main Campus Auditorium"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
                disabled={loading}
                className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Max Capacity (Seats)</label>
              <Input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
                disabled={loading}
                className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
              />
            </div>
          </div>

          {/* Event Poster Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold block text-neutral-300">Event Poster (PNG, JPG, WebP max 5MB)</label>
            {previewUrl || posterUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] p-2 flex items-center gap-3">
                <div className="relative h-16 w-24 shrink-0 rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                  <Image
                    src={previewUrl || posterUrl}
                    alt="Poster Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-semibold text-neutral-200 truncate">
                    {selectedFile ? selectedFile.name : "Event Poster"}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {selectedFile
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                      : "Attached"}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePoster}
                  className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-white/30 rounded-2xl p-4 text-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.05] group"
              >
                <UploadCloud className="h-8 w-8 mx-auto text-neutral-400 group-hover:text-neutral-200 transition-colors mb-1" />
                <div className="text-xs font-semibold text-neutral-200">
                  Click to browse event poster
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  Supports PNG, JPG, WebP up to 5MB
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Event Description *</label>
            <textarea
              className="flex w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 min-h-[70px] focus:outline-none"
              placeholder="Describe event format, rules, and participant criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={loading} className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>{uploadingPoster ? "Uploading Poster..." : "Publishing..."}</span>
                </>
              ) : (
                "Publish Event"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== EDIT EVENT DIALOG =====================
interface EditEventDialogProps {
  event: ClubEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedEvent: ClubEvent) => void;
  onError: (errorMsg: string) => void;
}

export function EditEventDialog({
  event,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: EditEventDialogProps) {
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("Music");
  const [description, setDescription] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [capacity, setCapacity] = React.useState("400");
  const [status, setStatus] = React.useState<"upcoming" | "ongoing" | "completed">("upcoming");
  const [posterUrl, setPosterUrl] = React.useState("");

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [uploadingPoster, setUploadingPoster] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (event && open) {
      setTitle(event.title || "");
      setCategory(event.category || "Music");
      setDescription(event.description || "");
      setVenue(event.venue || "");
      setCapacity(String(event.max_capacity) || "400");
      setStatus(event.status || "upcoming");
      setPosterUrl(event.poster_url || "");
      setSelectedFile(null);
      setFilePreview(null);
      setValidationError(null);
    }
  }, [event, open]);

  if (!event) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateMediaFile(file);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid file format or size.");
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleRemovePoster = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setPosterUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    setLoading(true);

    let finalPosterUrl = posterUrl;

    if (selectedFile) {
      setUploadingPoster(true);
      const uploadRes = await uploadMediaFile(selectedFile, "events");
      setUploadingPoster(false);

      if (uploadRes.success && uploadRes.url) {
        finalPosterUrl = uploadRes.url;
      }
    }

    const result = await updateEventAction(event.id, {
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      venue: venue.trim(),
      poster_url: finalPosterUrl,
      max_capacity: parseInt(capacity) || 200,
      status,
    });
    setLoading(false);

    if (result.success) {
      onSuccess({
        ...event,
        title: title.trim(),
        category,
        description: description.trim(),
        venue: venue.trim(),
        poster_url: finalPosterUrl,
        max_capacity: parseInt(capacity) || 200,
        status,
      });
      onOpenChange(false);
    } else {
      setValidationError(result.error || "Failed to update event.");
      onError(result.error || "Failed to update event.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
            <Edit className="h-5 w-5 text-neutral-300" />
            <span>Edit Event: {event.title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Modify event schedule, category, and update poster in Supabase Storage.
          </DialogDescription>
        </DialogHeader>

        {validationError && (
          <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Event Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
              className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Category</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} disabled={loading} className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Status</label>
              <select
                className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 focus-visible:outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                disabled={loading}
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing (Live)</option>
                <option value="completed">Completed / Archive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Venue</label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} required disabled={loading} className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1 text-neutral-300">Max Capacity</label>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} required disabled={loading} className="text-xs rounded-2xl bg-black/60 border-white/10 text-neutral-200" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Description *</label>
            <textarea
              className="flex w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-neutral-200 min-h-[70px] focus:outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={loading} className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
              {loading ? "Saving Changes..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== ASSIGN WINNERS DIALOG =====================
interface AssignWinnersDialogProps {
  events: ClubEvent[];
  selectedEventId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (eventId: string) => void;
  onError: (errorMsg: string) => void;
}

export function AssignWinnersDialog({
  events,
  selectedEventId,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: AssignWinnersDialogProps) {
  const [targetEventId, setTargetEventId] = React.useState(selectedEventId || events[0]?.id || "");
  const [firstTeam, setFirstTeam] = React.useState("The Fusion Kings");
  const [firstDesc, setFirstDesc] = React.useState("Gold champions for original raga fusion piece.");
  const [secondTeam, setSecondTeam] = React.useState("Rhythm Ensemble");
  const [thirdTeam, setThirdTeam] = React.useState("Acoustic Echoes");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (selectedEventId) setTargetEventId(selectedEventId);
  }, [selectedEventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await assignWinnersAction(targetEventId, [
      { position: "1st", name: firstTeam, college: "MALHAR Lead" },
      { position: "2nd", name: secondTeam, college: "Silver Team" },
      { position: "3rd", name: thirdTeam, college: "Bronze Team" },
    ]);
    setLoading(false);

    if (result.success) {
      onSuccess(targetEventId);
      onOpenChange(false);
    } else {
      onError(result.error || "Failed to assign winners.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[#0D0D0D] border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-neutral-100 font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-neutral-300" />
            <span>Assign Event Winners &amp; Hall of Fame</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Award trophies and record official champions on the public Hall of Fame.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold block mb-1 text-neutral-300">Select Event to Conclude</label>
            <select
              className="flex h-10 w-full rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-xs font-semibold text-neutral-200 focus-visible:outline-none"
              value={targetEventId}
              onChange={(e) => setTargetEventId(e.target.value)}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.category})
                </option>
              ))}
            </select>
          </div>

          {/* 1st Place Gold */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-200">
              <Trophy className="h-4 w-4 text-neutral-300" />
              <span>1st Place (Gold Champions)</span>
            </div>
            <Input
              placeholder="Winning Team / Solo Name"
              value={firstTeam}
              onChange={(e) => setFirstTeam(e.target.value)}
              required
              className="text-xs rounded-xl bg-black/60 border-white/10 text-neutral-200"
            />
            <Input
              placeholder="Citation / Performance Summary"
              value={firstDesc}
              onChange={(e) => setFirstDesc(e.target.value)}
              className="text-xs rounded-xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          {/* 2nd Place Silver */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
              <Award className="h-4 w-4 text-neutral-400" />
              <span>2nd Place (Silver Medalists)</span>
            </div>
            <Input
              placeholder="Runner Up Team / Solo"
              value={secondTeam}
              onChange={(e) => setSecondTeam(e.target.value)}
              required
              className="text-xs rounded-xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          {/* 3rd Place Bronze */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400">
              <Award className="h-4 w-4 text-neutral-500" />
              <span>3rd Place (Bronze Award)</span>
            </div>
            <Input
              placeholder="3rd Place Team / Solo"
              value={thirdTeam}
              onChange={(e) => setThirdTeam(e.target.value)}
              required
              className="text-xs rounded-xl bg-black/60 border-white/10 text-neutral-200"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-full border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={loading} className="rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4] shadow-sm">
              {loading ? "Recording..." : "Record Official Winners"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
