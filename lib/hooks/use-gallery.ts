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

// ─── Module-level request deduplication ───────────────────────────────────────
// If multiple hook instances (e.g. gallery page tabs) call fetchGallery at the
// same time, they all await the same single in-flight promise.
let _inflight: Promise<GalleryMedia[]> | null = null;
let _cacheTs = 0;
let _cacheData: GalleryMedia[] = [];
const CACHE_TTL = 60_000; // 60 s

export function useGallery(categoryFilter?: string) {
  const [allMedia, setAllMedia] = useState<GalleryMedia[]>(MOCK_GALLERY);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);

  const fetchGallery = useCallback(async () => {
    try {
      const cached = getSyncedData<GalleryMedia[]>(STORAGE_KEYS.GALLERY, MOCK_GALLERY);
      if (Array.isArray(cached) && cached.length > 0) setAllMedia(cached);

      // Return early if module-level cache is still fresh
      const now = Date.now();
      if (_cacheData.length > 0 && now - _cacheTs < CACHE_TTL) {
        setAllMedia(_cacheData);
        setLoading(false);
        return;
      }

      // Deduplicate: reuse the in-flight promise if one exists
      if (!_inflight) {
        _inflight = (async () => {
          // ─── Primary: server-side API (cached by browser for 60s)
          let remoteList: GalleryMedia[] = [];
          try {
            const res = await fetch("/api/public/gallery", {
              next: { revalidate: 60 },
            } as RequestInit);
            const json = await res.json();
            if (Array.isArray(json.data) && json.data.length > 0) {
              remoteList = json.data.map((d: any) => ({
                id: d.id,
                title: d.title || "Gallery Item",
                media_url: d.media_url,
                media_type: d.media_type || "image",
                category: d.category || "general",
                event_title: d.event_title || "",
                date: d.date || (d.created_at ? new Date(d.created_at).toLocaleDateString() : ""),
                thumbnail_color: "from-amber-600/30 via-orange-600/20 to-stone-900",
              }));
            }
          } catch {
            // API failed — fall through to direct Supabase
          }

          // ─── Fallback: direct Supabase client
          if (remoteList.length === 0) {
            const supabase = createClient();
            const queryPromise = (supabase.from("gallery") as any)
              .select("*")
              .order("created_at", { ascending: false });
            const timeoutPromise = new Promise<{ data: null }>((resolve) =>
              setTimeout(() => resolve({ data: null }), 4000)
            );
            const { data } = await Promise.race([queryPromise, timeoutPromise]);
            if (data && data.length > 0) {
              remoteList = data.map((d: any) => ({
                id: d.id,
                title: d.title || "Gallery Item",
                media_url: d.media_url,
                media_type: d.media_type || "image",
                category: d.category || "general",
                event_title: d.event_title || "",
                date: d.date || (d.created_at ? new Date(d.created_at).toLocaleDateString() : ""),
                thumbnail_color: "from-amber-600/30 via-orange-600/20 to-stone-900",
              }));
            }
          }

          return remoteList;
        })().finally(() => { _inflight = null; });
      }

      const remoteList = await _inflight;

      if (remoteList.length > 0) {
        const cachedCurrent = getSyncedData<GalleryMedia[]>(STORAGE_KEYS.GALLERY, MOCK_GALLERY);
        const remoteIds = new Set(remoteList.map((g) => g.id));
        const merged = [...remoteList];
        for (const localG of cachedCurrent) {
          if (!remoteIds.has(localG.id)) merged.push(localG);
        }
        // Update module-level cache
        _cacheData = merged;
        _cacheTs = Date.now();
        setAllMedia(merged);
        setSyncedData(STORAGE_KEYS.GALLERY, merged);
      }
    } catch {
      // Keep cached on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getSyncedData<GalleryMedia[]>(STORAGE_KEYS.GALLERY, MOCK_GALLERY);
    if (Array.isArray(cached) && cached.length > 0) setAllMedia(cached);
    fetchGallery();
  }, [fetchGallery]);

  // Same-browser sync
  useEffect(() => {
    return subscribeSync<GalleryMedia[]>(STORAGE_KEYS.GALLERY, MOCK_GALLERY, (updated) => {
      setAllMedia(Array.isArray(updated) && updated.length > 0 ? updated : MOCK_GALLERY);
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
