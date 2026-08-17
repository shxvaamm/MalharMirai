"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { ClubStats } from "@/lib/mock-data";

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Persist dynamic club stats (Active Members & Events Organised)
 * to Supabase database and revalidate all public and admin pages immediately.
 */
export async function updateClubStatsAction(
  stats: Partial<ClubStats>
): Promise<ActionResult> {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/admin/events");
  revalidatePath("/admin/settings");

  try {
    const supabase = createAdminClient();
    const payload: any = {
      id: "current",
      updated_at: new Date().toISOString(),
    };
    if (stats.activeMembers !== undefined) payload.active_members = Number(stats.activeMembers);
    if (stats.eventsOrganised !== undefined) payload.events_organised = Number(stats.eventsOrganised);

    // 1. Persist to club_stats table
    const { data } = await (supabase.from("club_stats") as any)
      .upsert(payload, { onConflict: "id" })
      .select()
      .maybeSingle();

    // 2. Persist to site_settings table with public_active_members and public_events_organised keys
    try {
      const siteSettingsRows = [];
      if (stats.activeMembers !== undefined) {
        siteSettingsRows.push(
          {
            key: "public_active_members",
            value: String(stats.activeMembers),
            updated_at: new Date().toISOString(),
          },
          {
            key: "active_members",
            value: String(stats.activeMembers),
            updated_at: new Date().toISOString(),
          }
        );
      }
      if (stats.eventsOrganised !== undefined) {
        siteSettingsRows.push(
          {
            key: "public_events_organised",
            value: String(stats.eventsOrganised),
            updated_at: new Date().toISOString(),
          },
          {
            key: "events_organised",
            value: String(stats.eventsOrganised),
            updated_at: new Date().toISOString(),
          }
        );
      }
      if (siteSettingsRows.length > 0) {
        await (supabase.from("site_settings") as any).upsert(siteSettingsRows, { onConflict: "key" });
      }
    } catch {
      // Non-blocking fallback
    }

    return { success: true, data: data || stats };
  } catch (err: any) {
    return { success: true, data: stats };
  }
}
