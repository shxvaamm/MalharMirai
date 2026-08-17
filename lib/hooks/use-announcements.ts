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

export function useAnnouncements(priorityFilter?: string) {
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const cached = getSyncedData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS);
      if (cached && cached.length > 0) setAllAnnouncements(cached);

      const supabase = createClient();
      const queryPromise = (supabase.from("announcements") as any)
        .select("*")
        .order("created_at", { ascending: false });
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 4000)
      );

      const { data } = await Promise.race([queryPromise, timeoutPromise]);

      if (data && data.length > 0) {
        const cachedCurrent = getSyncedData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS);
        const remoteList: Announcement[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          content: d.content,
          priority: d.priority || "normal",
          is_emergency: !!d.is_emergency,
          created_at: d.created_at,
          category: d.priority === "urgent" ? "Urgent Update" : "General Circular",
        }));

        const remoteIds = new Set(remoteList.map((a) => a.id));
        const merged = [...remoteList];
        for (const localA of cachedCurrent) {
          if (!remoteIds.has(localA.id)) merged.push(localA);
        }

        setAllAnnouncements(merged);
        setSyncedData(STORAGE_KEYS.ANNOUNCEMENTS, merged);
      }
    } catch {
      // Keep cached announcements
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getSyncedData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS);
    if (cached && cached.length > 0) setAllAnnouncements(cached);
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Same-browser sync
  useEffect(() => {
    return subscribeSync<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS, (updated) => {
      setAllAnnouncements(updated);
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
