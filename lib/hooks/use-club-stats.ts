"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

export interface SupabaseClubStats {
  public_active_members: string;
  public_events_organised: string;
  activeMembers: number;
  eventsOrganised: number;
  loading: boolean;
}

export const DEFAULT_PUBLIC_ACTIVE = 7;
export const DEFAULT_PUBLIC_EVENTS = 8;

export function useClubStats() {
  const [stats, setStats] = React.useState<SupabaseClubStats>({
    public_active_members: `${DEFAULT_PUBLIC_ACTIVE}+`,
    public_events_organised: `${DEFAULT_PUBLIC_EVENTS}+`,
    activeMembers: DEFAULT_PUBLIC_ACTIVE,
    eventsOrganised: DEFAULT_PUBLIC_EVENTS,
    loading: true,
  });

  const fetchRemoteStats = React.useCallback(async () => {
    try {
      const supabase = createClient();

      // 1. Direct Supabase query to site_settings
      const { data: settingsData, error } = await (supabase.from("site_settings") as any)
        .select("*");

      if (error) {
        console.warn("Supabase site_settings fetch error:", error.message);
      }

      let remoteActive: number | null = null;
      let remoteEvents: number | null = null;

      if (settingsData && Array.isArray(settingsData)) {
        const actSetting = settingsData.find(
          (s: any) => s.key === "public_active_members" || s.key === "active_members"
        );
        const evSetting = settingsData.find(
          (s: any) => s.key === "public_events_organised" || s.key === "events_organised"
        );

        if (actSetting?.value !== undefined && actSetting?.value !== null) {
          const num = parseInt(String(actSetting.value).replace(/\D/g, ""), 10);
          if (!isNaN(num)) remoteActive = num;
        }
        if (evSetting?.value !== undefined && evSetting?.value !== null) {
          const num = parseInt(String(evSetting.value).replace(/\D/g, ""), 10);
          if (!isNaN(num)) remoteEvents = num;
        }
      }

      // 2. Fallback to club_stats if site_settings didn't return values
      if (remoteActive === null || remoteEvents === null) {
        const { data: clubStatsData } = await (supabase.from("club_stats") as any)
          .select("*")
          .maybeSingle();

        if (clubStatsData) {
          if (remoteActive === null && clubStatsData.active_members !== undefined && !isNaN(Number(clubStatsData.active_members))) {
            remoteActive = Number(clubStatsData.active_members);
          }
          if (remoteEvents === null && clubStatsData.events_organised !== undefined && !isNaN(Number(clubStatsData.events_organised))) {
            remoteEvents = Number(clubStatsData.events_organised);
          }
        }
      }

      const finalActive = remoteActive !== null ? remoteActive : DEFAULT_PUBLIC_ACTIVE;
      const finalEvents = remoteEvents !== null ? remoteEvents : DEFAULT_PUBLIC_EVENTS;

      setStats({
        public_active_members: `${finalActive}+`,
        public_events_organised: `${finalEvents}+`,
        activeMembers: finalActive,
        eventsOrganised: finalEvents,
        loading: false,
      });
    } catch (err) {
      console.warn("fetchRemoteStats error:", err);
      setStats((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  }, []);

  React.useEffect(() => {
    // 1. Initial direct fetch from Supabase
    fetchRemoteStats();

    // 2. Window focus & visibility listeners
    const handleFocus = () => {
      fetchRemoteStats();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    // 3. Real-time Supabase subscription across all browsers and incognito windows
    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel("realtime_site_settings_public")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "site_settings" },
          () => {
            fetchRemoteStats();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "club_stats" },
          () => {
            fetchRemoteStats();
          }
        )
        .subscribe();
    } catch {
      // Graceful fallback if realtime is unavailable
    }

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [fetchRemoteStats]);

  const updateStats = React.useCallback(
    async (newStats: { activeMembers?: number; eventsOrganised?: number }) => {
      const nextActive = newStats.activeMembers !== undefined ? newStats.activeMembers : stats.activeMembers;
      const nextEvents = newStats.eventsOrganised !== undefined ? newStats.eventsOrganised : stats.eventsOrganised;

      // Optimistically update React state
      setStats({
        public_active_members: `${nextActive}+`,
        public_events_organised: `${nextEvents}+`,
        activeMembers: nextActive,
        eventsOrganised: nextEvents,
        loading: false,
      });

      // 1. Write directly to Supabase site_settings table with onConflict
      try {
        const supabase = createClient();
        const settingsUpserts = [];
        if (newStats.activeMembers !== undefined) {
          settingsUpserts.push(
            { key: "public_active_members", value: String(newStats.activeMembers), updated_at: new Date().toISOString() },
            { key: "active_members", value: String(newStats.activeMembers), updated_at: new Date().toISOString() }
          );
        }
        if (newStats.eventsOrganised !== undefined) {
          settingsUpserts.push(
            { key: "public_events_organised", value: String(newStats.eventsOrganised), updated_at: new Date().toISOString() },
            { key: "events_organised", value: String(newStats.eventsOrganised), updated_at: new Date().toISOString() }
          );
        }
        if (settingsUpserts.length > 0) {
          await (supabase.from("site_settings") as any).upsert(settingsUpserts, { onConflict: "key" });
        }

        const clubStatsPayload: any = {
          id: "current",
          updated_at: new Date().toISOString(),
        };
        if (newStats.activeMembers !== undefined) clubStatsPayload.active_members = newStats.activeMembers;
        if (newStats.eventsOrganised !== undefined) clubStatsPayload.events_organised = newStats.eventsOrganised;

        await (supabase.from("club_stats") as any).upsert(clubStatsPayload, { onConflict: "id" });
      } catch (err) {
        console.warn("Direct Supabase stats write warning:", err);
      }

      // 2. Server Action for SSR path revalidations
      try {
        const { updateClubStatsAction } = await import("@/lib/actions/stats");
        await updateClubStatsAction(newStats);
      } catch {}
    },
    [stats.activeMembers, stats.eventsOrganised]
  );

  return {
    stats,
    updateStats,
    loading: stats.loading,
    activeMembersCount: stats.activeMembers,
    eventsOrganisedCount: stats.eventsOrganised,
  };
}
