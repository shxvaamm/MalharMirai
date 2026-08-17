"use client";

import * as React from "react";
import Image from "next/image";
import {
  ImageIcon,
  UploadCloud,
  Trash2,
  Filter,
  Plus,
  Play,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { useToast } from "@/components/ui/toast";
import { UploadMediaDialog } from "@/components/admin/gallery-dialogs";
import { DeleteConfirmDialog } from "@/components/admin/member-dialogs";
import { deleteGalleryMediaAction } from "@/lib/actions/gallery";
import { GalleryMedia } from "@/lib/mock-data";

export default function AdminGalleryPage() {
  const { gallery, addGalleryMediaToState, deleteGalleryMedia } = useAdminData();
  const { toast } = useToast();

  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<GalleryMedia | null>(null);

  const filteredMedia = gallery.filter((item) => {
    return categoryFilter === "all" || item.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
            Media &amp; <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Gallery Curator</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Upload stage photography, link performance reels, and organize cultural fest visual archives.
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-1.5 shadow-sm rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Add Media</span>
        </Button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "All Media" },
          { id: "previous_events", label: "Previous Events" },
          { id: "workshops", label: "Workshops & Showcases" },
          { id: "general", label: "General Campus" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              categoryFilter === tab.id
                ? "bg-neutral-200 text-neutral-950 shadow-sm"
                : "border border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-3xl overflow-hidden glass-panel border border-white/[0.06] bg-[#0D0D0D]/75 hover:border-white/15 transition-all flex flex-col justify-between shadow-xl"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
              <Image
                src={item.media_url}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 300px"
              />
              <div className="absolute top-2 left-2">
                <Badge variant="member" className="text-[9px] capitalize bg-black/70 backdrop-blur-md border border-white/10 text-neutral-300">
                  {item.category.replace("_", " ")}
                </Badge>
              </div>
              {item.media_type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="h-8 w-8 rounded-full bg-neutral-200 text-neutral-950 flex items-center justify-center shadow-md">
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3.5 flex items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-semibold text-neutral-200 truncate">{item.title}</h4>
                <p className="text-[10px] text-neutral-400">{item.date || "Fest 2026"}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(item)}
                className="h-7 w-7 p-0 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20 shrink-0 rounded-full"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>


      {/* Dialogs */}
      <UploadMediaDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={async (title, url, category, type, id) => {
          addGalleryMediaToState({
            id: id || `gal-${Date.now()}`,
            title,
            media_url: url,
            category,
            media_type: type,
            date: "Fest 2026",
            event_title: "Mirai Cultural Showcase",
            thumbnail_color: "from-sky-600/30 via-blue-600/20 to-slate-950",
          });
          toast({ title: "Media Added", description: `"${title}" has been published to the gallery.` });
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(op) => !op && setDeleteTarget(null)}
        title="Remove Media Item"
        description={`Are you sure you want to remove "${deleteTarget?.title}" from the gallery?`}
        onConfirm={async () => {
          if (deleteTarget) {
            const res = await deleteGalleryMediaAction(deleteTarget.id);
            if (res.success) {
              deleteGalleryMedia(deleteTarget.id);
              toast({ title: "Media Removed", description: "Item deleted from gallery and storage.", type: "warning" });
            } else {
              deleteGalleryMedia(deleteTarget.id);
              toast({ title: "Media Removed", description: "Item removed.", type: "warning" });
            }
          }
        }}
      />
    </div>
  );
}
