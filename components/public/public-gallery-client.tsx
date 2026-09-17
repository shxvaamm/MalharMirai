"use client";

import * as React from "react";
import { Image as ImageIcon } from "lucide-react";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { EmptyState } from "@/components/public/empty-state";
import { GalleryMedia } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { STORAGE_KEYS, subscribeSync } from "@/lib/store/sync-store";

interface PublicGalleryClientProps {
  initialMedia: GalleryMedia[];
}

export function PublicGalleryClient({ initialMedia }: PublicGalleryClientProps) {
  const [media, setMedia] = React.useState<GalleryMedia[]>(initialMedia);

  // Synchronize state when server component passes fresh initialMedia (on refresh or page load)
  React.useEffect(() => {
    setMedia(initialMedia);
  }, [initialMedia]);

  // 1. Same-browser cross-tab sync: if admin deletes in another tab of the same browser
  React.useEffect(() => {
    return subscribeSync<GalleryMedia[]>(STORAGE_KEYS.GALLERY, initialMedia, (updated) => {
      if (Array.isArray(updated)) {
        setMedia(updated);
      }
    });
  }, [initialMedia]);

  // 2. Realtime listener: cross-device/cross-browser instant update WITHOUT refresh
  React.useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel("public_gallery_realtime")
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "gallery" },
          (payload) => {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setMedia((prev) => prev.filter((item) => item.id !== deletedId));
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "gallery" },
          (payload) => {
            const newRow = payload.new as any;
            if (newRow && newRow.media_url) {
              const newItem: GalleryMedia = {
                id: newRow.id,
                title: newRow.title || "Gallery Showcase",
                media_url: newRow.media_url,
                media_type: newRow.media_type || "image",
                category: newRow.category || "general",
                event_title: newRow.event_title || "",
                date: newRow.date || (newRow.created_at ? new Date(newRow.created_at).toLocaleDateString() : "2026"),
                thumbnail_color: "from-amber-600/30 via-orange-600/20 to-stone-900",
              };
              setMedia((prev) => {
                if (prev.some((item) => item.id === newItem.id || item.media_url === newItem.media_url)) {
                  return prev;
                }
                return [newItem, ...prev];
              });
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "gallery" },
          (payload) => {
            const updatedRow = payload.new as any;
            if (updatedRow && updatedRow.id) {
              setMedia((prev) =>
                prev.map((item) =>
                  item.id === updatedRow.id
                    ? {
                        ...item,
                        title: updatedRow.title || item.title,
                        media_url: updatedRow.media_url || item.media_url,
                        category: updatedRow.category || item.category,
                      }
                    : item
                )
              );
            }
          }
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {}
      };
    } catch {}
  }, []);

  if (media.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon className="h-7 w-7" />}
        headline="No photos yet — but we're just getting started."
        subtext="Our gallery fills up after every event. Follow us on Instagram for the latest photos from MALHAR."
        showInstagramCta={true}
      />
    );
  }

  return <GalleryGrid media={media} />;
}
