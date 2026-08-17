"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClubEvent, MOCK_EVENTS } from "@/lib/mock-data";
import {
  getSyncedData,
  setSyncedData,
  STORAGE_KEYS,
  subscribeSync,
} from "@/lib/store/sync-store";

function computeEventsWithLiveRegistrations(eventsList: ClubEvent[]): ClubEvent[] {
  const registrations = getSyncedData<any[]>(STORAGE_KEYS.REGISTRATIONS, []);
  return eventsList.map((ev) => {
    const regCount = registrations.filter(
      (r) =>
        r.event_id === ev.id ||
        (r.event_title && ev.title && r.event_title.trim().toLowerCase() === ev.title.trim().toLowerCase())
    ).length;
    return {
      ...ev,
      registered_count: Math.max(ev.registered_count || 0, regCount),
    };
  });
}

function mapDbEvent(d: any, cachedCurrent: ClubEvent[]): ClubEvent {
  const match = cachedCurrent.find((c) => c.id === d.id);
  return {
    id: d.id,
    title: d.title || match?.title || "Event",
    description: d.description || match?.description || "",
    category: d.category || match?.category || "General",
    date_time: d.date_time || match?.date_time || new Date().toISOString(),
    venue: d.venue || match?.venue || "",
    poster_url: d.poster_url || match?.poster_url || MOCK_EVENTS[0]?.poster_url,
    max_capacity: d.max_capacity || match?.max_capacity || 300,
    registered_count: d.registered_count ?? match?.registered_count ?? 0,
    status: d.status || match?.status || "upcoming",
    registration_deadline: d.registration_deadline || match?.registration_deadline || "",
    rules: Array.isArray(d.rules) && d.rules.length > 0 ? d.rules : (match?.rules || ["Valid Mirai Student Registration Pass required."]),
    prizes: Array.isArray(d.prizes) && d.prizes.length > 0 ? d.prizes : (match?.prizes || []),
  };
}

export function useEvents(categoryFilter?: string, statusFilter?: string) {
  const [allEvents, setAllEvents] = useState<ClubEvent[]>(() =>
    computeEventsWithLiveRegistrations(MOCK_EVENTS)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const cached = getSyncedData<ClubEvent[]>(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
      if (cached && cached.length > 0) {
        setAllEvents(computeEventsWithLiveRegistrations(cached));
      }

      const supabase = createClient();
      const queryPromise = (supabase.from("events") as any)
        .select("*")
        .order("date_time", { ascending: true });
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 4000)
      );

      const { data } = await Promise.race([queryPromise, timeoutPromise]);

      if (data && data.length > 0) {
        const cachedCurrent = getSyncedData<ClubEvent[]>(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
        const remoteFormatted: ClubEvent[] = data.map((d: any) => mapDbEvent(d, cachedCurrent));

        // Preserve local events not yet in DB
        const remoteIds = new Set(remoteFormatted.map((e) => e.id));
        const mergedList = [...remoteFormatted];
        for (const localEv of cachedCurrent) {
          if (!remoteIds.has(localEv.id)) mergedList.push(localEv);
        }

        const computedList = computeEventsWithLiveRegistrations(mergedList);
        setAllEvents(computedList);
        setSyncedData(STORAGE_KEYS.EVENTS, computedList);
      }
    } catch (err: any) {
      setError(err?.message || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getSyncedData<ClubEvent[]>(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
    if (cached && cached.length > 0) {
      setAllEvents(computeEventsWithLiveRegistrations(cached));
    }
    fetchEvents();
  }, [fetchEvents]);

  // Same-browser sync
  useEffect(() => {
    const unsubEvents = subscribeSync<ClubEvent[]>(STORAGE_KEYS.EVENTS, MOCK_EVENTS, (updated) => {
      setAllEvents(computeEventsWithLiveRegistrations(updated));
    });
    const unsubRegs = subscribeSync<any[]>(STORAGE_KEYS.REGISTRATIONS, [], () => {
      const currentEvents = getSyncedData<ClubEvent[]>(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
      setAllEvents(computeEventsWithLiveRegistrations(currentEvents));
    });
    return () => {
      unsubEvents();
      unsubRegs();
    };
  }, []);

  // ✅ Supabase Realtime — cross-device, any browser, Incognito
  useEffect(() => {
    const supabase = createClient();

    // Listen to events table changes (for registered_count updates)
    const channel = supabase
      .channel("realtime:events:public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => { fetchEvents(); }
      )
      // Also listen to registrations — when a new registration is inserted,
      // re-fetch events so registered_count updates on all browsers
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "registrations" },
        () => { fetchEvents(); }
      )
      .subscribe();

    channelRef.current = channel;

    // Poll every 10 seconds as fallback if Realtime isn't firing
    const pollTimer = setInterval(() => { fetchEvents(); }, 10000);

    return () => {
      clearInterval(pollTimer);
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [fetchEvents]);

  const events = allEvents.filter((e) => {
    const matchStatus = !statusFilter || statusFilter === "all" || e.status === statusFilter;
    const matchCategory =
      !categoryFilter ||
      categoryFilter === "all" ||
      e.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchStatus && matchCategory;
  });

  return { events, loading, error, refresh: fetchEvents };
}

export function useEventById(id: string) {
  const [allEvents, setAllEvents] = useState<ClubEvent[]>(() =>
    computeEventsWithLiveRegistrations(MOCK_EVENTS)
  );
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data } = await (supabase.from("events") as any).select("*").eq("id", id).maybeSingle();
      if (data) {
        setAllEvents((prev) => {
          const others = prev.filter((e) => e.id !== id);
          return [mapDbEvent(data, prev), ...others];
        });
      }
    } catch {}
  }, [id]);

  useEffect(() => {
    const cached = getSyncedData<ClubEvent[]>(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
    if (cached && cached.length > 0) {
      setAllEvents(computeEventsWithLiveRegistrations(cached));
    }

    const unsubEvents = subscribeSync<ClubEvent[]>(STORAGE_KEYS.EVENTS, MOCK_EVENTS, (updated) => {
      setAllEvents(computeEventsWithLiveRegistrations(updated));
    });
    const unsubRegs = subscribeSync<any[]>(STORAGE_KEYS.REGISTRATIONS, [], () => {
      const currentEvents = getSyncedData<ClubEvent[]>(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
      setAllEvents(computeEventsWithLiveRegistrations(currentEvents));
    });
    fetchEvents();

    return () => {
      unsubEvents();
      unsubRegs();
    };
  }, [fetchEvents]);

  // ✅ Supabase Realtime for single event + registrations
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("realtime:event:" + id)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        fetchEvents();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "registrations" }, () => {
        fetchEvents();
      })
      .subscribe();

    // Poll every 8 seconds as fallback
    const pollTimer = setInterval(() => { fetchEvents(); }, 8000);

    return () => {
      clearInterval(pollTimer);
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [id, fetchEvents]);

  const event =
    allEvents.find((e) => e.id === id) ||
    MOCK_EVENTS.find((e) => e.id === id) ||
    allEvents[0] ||
    MOCK_EVENTS[0];

  return { event, loading };
}
