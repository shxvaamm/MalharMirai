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
      const supabase = createClient();
      const queryPromise = (supabase.from("gallery") as any)
        .select("*")
        .order("created_at", { ascending: false });
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 4000)
      );

      const res = await Promise.race([queryPromise, timeoutPromise]);
      if (!res || !("data" in res) || res.data === null) return;

      const remoteList: GalleryMedia[] = (res.data || []).map((d: any) => ({
        id: d.id,
        title: d.title || "Gallery Item",
        media_url: d.media_url,
        media_type: d.media_type || "image",
        category: d.category || "general",
        event_title: d.event_title || "",
        date: d.date || (d.created_at ? new Date(d.created_at).toLocaleDateString() : ""),
        thumbnail_color: "from-amber-600/30 via-orange-600/20 to-stone-900",
      }));

      // Supabase is the sole source of truth: remoteList directly replaces local
      // state and cache. Missing from remote always means deleted.
      setAllMedia(remoteList);
      setSyncedData(STORAGE_KEYS.GALLERY, remoteList);
      stampGalleryCacheVersion();
    } catch {
      // Keep cached on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isGalleryCacheVersionCurrent()) {
      wipeGalleryCache();
      setAllMedia(MOCK_GALLERY);
    } else {
      const cached = getSyncedData<GalleryMedia[]>(STORAGE_KEYS.GALLERY, MOCK_GALLERY);
      if (Array.isArray(cached) && cached.length > 0) setAllMedia(cached);
    }
    fetchGallery();
  }, [fetchGallery]);

  // Same-browser sync
  useEffect(() => {
    return subscribeSync<GalleryMedia[]>(STORAGE_KEYS.GALLERY, MOCK_GALLERY, (updated) => {
      setAllMedia(Array.isArray(updated) ? updated : MOCK_GALLERY);
    });
  }, []);

  // ✅ Supabase Realtime — cross-device, any browser, Incognito
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("realtime:gallery")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery" },
        () => {
          fetchGallery();
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [fetchGallery]);

  let media = [...allMedia];
  if (categoryFilter && categoryFilter !== "all") {
    media = media.filter((m) => m.category === categoryFilter);
  }

  return { media, loading, refresh: fetchGallery };
}
