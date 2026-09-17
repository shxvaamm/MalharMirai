"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Announcement, MOCK_ANNOUNCEMENTS } from "@/lib/mock-data";
import {
  getSyncedData,
  setSyncedData,
  STORAGE_KEYS,
  subscribeSync,
} from "@/lib/store/sync-store";

// ─── Cache Versioning ────────────────────────────────────────────────────────
const ANNOUNCEMENTS_CACHE_V = "v2-supabase-truth";
const ANNOUNCEMENTS_CACHE_VERSION_KEY = "malhar_announcements_cache_version";

function isCacheVersionCurrent(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ANNOUNCEMENTS_CACHE_VERSION_KEY) === ANNOUNCEMENTS_CACHE_V;
  } catch {
    return false;
  }
}

function stampCacheVersion(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ANNOUNCEMENTS_CACHE_VERSION_KEY, ANNOUNCEMENTS_CACHE_V);
  } catch {}
}

function wipeAnnouncementsCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
    localStorage.setItem(ANNOUNCEMENTS_CACHE_VERSION_KEY, ANNOUNCEMENTS_CACHE_V);
  } catch {}
}

export function useAnnouncements(priorityFilter?: string, initialAnnouncements?: Announcement[]) {
  const serverProvided = initialAnnouncements !== undefined;

  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>(
    serverProvided ? initialAnnouncements! : MOCK_ANNOUNCEMENTS
  );
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const supabase = createClient();
      const queryPromise = (supabase.from("announcements") as any)
        .select("*")
        .order("created_at", { ascending: false });
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 4000)
      );

      const res = await Promise.race([queryPromise, timeoutPromise]);
      if (!res || !("data" in res) || res.data === null) return;

      const remoteList: Announcement[] = (res.data || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        priority: d.priority || "normal",
        is_emergency: !!d.is_emergency,
        created_at: d.created_at,
        category: d.priority === "urgent" ? "Urgent Update" : "General Circular",
      }));

      // Supabase is the sole source of truth: remoteList directly replaces local
      // state and cache. Missing from remote always means deleted.
      setAllAnnouncements(remoteList);
      setSyncedData(STORAGE_KEYS.ANNOUNCEMENTS, remoteList);
      stampCacheVersion();
    } catch {
      // Keep cached announcements on network failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If server provided initial data, skip the localStorage/Supabase fetch on mount.
    // Server data is fresher than any cached localStorage copy.
    if (serverProvided) return;

    if (!isCacheVersionCurrent()) {
      wipeAnnouncementsCache();
      setAllAnnouncements(MOCK_ANNOUNCEMENTS);
    } else {
      const cached = getSyncedData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS);
      if (cached && cached.length > 0) setAllAnnouncements(cached);
    }
    fetchAnnouncements();
  }, [fetchAnnouncements, serverProvided]);

  // Same-browser sync
  useEffect(() => {
    return subscribeSync<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS, (updated) => {
      setAllAnnouncements(Array.isArray(updated) ? updated : MOCK_ANNOUNCEMENTS);
    });
  }, []);

  // ✅ Supabase Realtime — cross-device, any browser, Incognito
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("realtime:announcements")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [fetchAnnouncements]);

  let announcements = [...allAnnouncements];
  if (priorityFilter && priorityFilter !== "all") {
    announcements = announcements.filter((a) => a.priority === priorityFilter);
  }

  const emergencyAlert = allAnnouncements.find((a) => a.is_emergency) || null;

  return { announcements, emergencyAlert, loading, refresh: fetchAnnouncements };
}
