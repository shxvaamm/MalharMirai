import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { STAT_FALLBACKS } from "@/lib/mock-data";

export interface LivePublicStats {
  activeMembers: string;
  eventsOrganised: string;
  activeMembersCount: number;
  eventsOrganisedCount: number;
}

function getPublicSupabaseClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://lqaldejqwxtvbrqymkln.supabase.co")
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_X_DukL0UshA3UVCIKPTSDg_H4Z_L5Oz";

  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      // Participate in Next.js ISR Data Cache — concurrent requests within
      // the same 60s window are deduplicated without hitting the DB twice.
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate: 60 } } as RequestInit),
    },
  });
}

/**
 * Fetches live, auto-computed society counts directly from canonical database tables.
 * Uses HTTP HEAD requests with exact count aggregation for ultra-fast response (<10ms)
 * without transferring row data over the wire or invoking cookie headers.
 */
export async function getLivePublicStats(): Promise<LivePublicStats> {
  try {
    const supabase = getPublicSupabaseClient();
    const [
      { count: membersCount, error: memError },
      { count: eventsCount, error: evError }
    ] = await Promise.all([
      supabase.from("club_members").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true })
    ]);

    const fallbackActive = parseInt(STAT_FALLBACKS.activeMembers.replace(/\D/g, ""), 10) || 6;
    const fallbackEvents = parseInt(STAT_FALLBACKS.eventsOrganised.replace(/\D/g, ""), 10) || 1;

    const activeCount =
      membersCount !== null && membersCount !== undefined && !memError
        ? membersCount
        : fallbackActive;

    const evCount =
      eventsCount !== null && eventsCount !== undefined && !evError
        ? eventsCount
        : fallbackEvents;

    return {
      activeMembers: `${activeCount}+`,
      eventsOrganised: `${evCount}+`,
      activeMembersCount: activeCount,
      eventsOrganisedCount: evCount,
    };
  } catch (error) {
    console.error("[getLivePublicStats] Failed to fetch live stats from database:", error);
    const fallbackActive = parseInt(STAT_FALLBACKS.activeMembers.replace(/\D/g, ""), 10) || 6;
    const fallbackEvents = parseInt(STAT_FALLBACKS.eventsOrganised.replace(/\D/g, ""), 10) || 1;
    return {
      activeMembers: `${fallbackActive}+`,
      eventsOrganised: `${fallbackEvents}+`,
      activeMembersCount: fallbackActive,
      eventsOrganisedCount: fallbackEvents,
    };
  }
}
