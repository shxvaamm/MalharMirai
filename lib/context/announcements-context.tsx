"use client";

/**
 * AnnouncementsContext
 *
 * Single source of truth for announcements data across all public-page consumers
 * (EmergencyBanner in layout + AnnouncementsContent on /announcements).
 *
 * One provider in layout.tsx → ONE Supabase Realtime channel, created exactly once
 * per browser session. Eliminates the duplicate-channel error that occurred when both
 * EmergencyBanner and AnnouncementsContent independently called useAnnouncements and
 * each tried to subscribe their own channel on Supabase's singleton client.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { Announcement, MOCK_ANNOUNCEMENTS } from "@/lib/mock-data";
import {
  getSyncedData,
  setSyncedData,
  STORAGE_KEYS,
  subscribeSync,
} from "@/lib/store/sync-store";

// ── Cache versioning (kept in sync with use-announcements.ts) ─────────────────
const CACHE_V = "v2-supabase-truth";
const CACHE_VER_KEY = "malhar_announcements_cache_version";

function isCacheVersionCurrent(): boolean {
  if (typeof window === "undefined") return true;
  try { return localStorage.getItem(CACHE_VER_KEY) === CACHE_V; }
  catch { return false; }
}
function stampCacheVersion(): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(CACHE_VER_KEY, CACHE_V); } catch {}
}
function wipeCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
    localStorage.setItem(CACHE_VER_KEY, CACHE_V);
  } catch {}
}

// ── Context ───────────────────────────────────────────────────────────────────
interface AnnouncementsContextValue {
  announcements: Announcement[];
  emergencyAlert: Announcement | null;
  loading: boolean;
}

const AnnouncementsContext = createContext<AnnouncementsContextValue>({
  announcements: MOCK_ANNOUNCEMENTS,
  emergencyAlert: null,
  loading: false,
});

export function useAnnouncementsContext(): AnnouncementsContextValue {
  return useContext(AnnouncementsContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────
interface AnnouncementsProviderProps {
  /** Pre-fetched announcements from the server component (layout.tsx). */
  initialAnnouncements?: Announcement[];
  children: React.ReactNode;
}

export function AnnouncementsProvider({
  initialAnnouncements,
  children,
}: AnnouncementsProviderProps) {
  const serverProvided = initialAnnouncements !== undefined;

  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>(
    serverProvided ? initialAnnouncements! : MOCK_ANNOUNCEMENTS
  );
  const [loading, setLoading] = useState(false);

  // ── Remote fetch ─────────────────────────────────────────────────────────
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

      setAllAnnouncements(remoteList);
      setSyncedData(STORAGE_KEYS.ANNOUNCEMENTS, remoteList);
      stampCacheVersion();
    } catch {
      // Keep current state on network failure
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial fetch (only when server didn't provide data) ──────────────────
  useEffect(() => {
    if (serverProvided) return;

    if (!isCacheVersionCurrent()) {
      wipeCache();
      setAllAnnouncements(MOCK_ANNOUNCEMENTS);
    } else {
      const cached = getSyncedData<Announcement[]>(
        STORAGE_KEYS.ANNOUNCEMENTS,
        MOCK_ANNOUNCEMENTS
      );
      if (cached && cached.length > 0) setAllAnnouncements(cached);
    }
    fetchAnnouncements();
  }, [fetchAnnouncements, serverProvided]);

  // ── Same-browser tab sync (BroadcastChannel) ─────────────────────────────
  useEffect(() => {
    return subscribeSync<Announcement[]>(
      STORAGE_KEYS.ANNOUNCEMENTS,
      MOCK_ANNOUNCEMENTS,
      (updated) => {
        setAllAnnouncements(Array.isArray(updated) ? updated : MOCK_ANNOUNCEMENTS);
      }
    );
  }, []);

  // ── Supabase Realtime — ONE channel, created exactly once per provider mount
  // The provider lives in layout.tsx and never unmounts during navigation, so
  // this channel stays open for the entire session. All consumers (EmergencyBanner,
  // AnnouncementsContent) read from context — they never create their own channels.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("announcements-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => { fetchAnnouncements(); }
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [fetchAnnouncements]);

  const emergencyAlert = allAnnouncements.find((a) => a.is_emergency) ?? null;

  return (
    <AnnouncementsContext.Provider
      value={{ announcements: allAnnouncements, emergencyAlert, loading }}
    >
      {children}
    </AnnouncementsContext.Provider>
  );
}
