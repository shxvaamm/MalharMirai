"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { GalleryMedia, MOCK_GALLERY } from "@/lib/mock-data";
import {
  getSyncedData,
  setSyncedData,
  STORAGE_KEYS,
  subscribeSync,
} from "@/lib/store/sync-store";
import { getPublicGalleryList } from "@/lib/actions/gallery";

// ─── Cache Versioning ────────────────────────────────────────────────────────
const GALLERY_CACHE_V = "v2-supabase-truth";
const GALLERY_CACHE_VERSION_KEY = "malhar_gallery_cache_version";

function isGalleryCacheVersionCurrent(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(GALLERY_CACHE_VERSION_KEY) === GALLERY_CACHE_V;
  } catch {
    return false;
  }
}

function stampGalleryCacheVersion(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GALLERY_CACHE_VERSION_KEY, GALLERY_CACHE_V);
  } catch {}
}

function wipeGalleryCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEYS.GALLERY);
    localStorage.setItem(GALLERY_CACHE_VERSION_KEY, GALLERY_CACHE_V);
  } catch {}
}

export function useGallery(categoryFilter?: string) {
  const [allMedia, setAllMedia] = useState<GalleryMedia[]>(MOCK_GALLERY);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);

  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true);
      const remoteList = await getPublicGalleryList();
      if (Array.isArray(remoteList)) {
        setAllMedia(remoteList);
        setSyncedData(STORAGE_KEYS.GALLERY, remoteList);
        stampGalleryCacheVersion();
      }
    } catch (err) {
      console.error("[useGallery] fetchGallery exception:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Same-browser sync (instant cross-tab reflection without network delay)
  useEffect(() => {
    return subscribeSync<GalleryMedia[]>(STORAGE_KEYS.GALLERY, MOCK_GALLERY, (updated) => {
      setAllMedia(Array.isArray(updated) ? updated : MOCK_GALLERY);
    });
  }, []);

  // Supabase Realtime — cross-device, any browser, Incognito
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("realtime:gallery")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery" },
        (payload) => {
          console.log("[useGallery] Realtime postgres_changes event:", payload);
          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setAllMedia((prev) => prev.filter((item) => item.id !== deletedId));
            }
          }
          fetchGallery();
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [fetchGallery]);

  let media = [...allMedia];
  if (categoryFilter && categoryFilter !== "all") {
    media = media.filter((m) => m.category === categoryFilter);
  }

  return { media, loading, refresh: fetchGallery };
}
