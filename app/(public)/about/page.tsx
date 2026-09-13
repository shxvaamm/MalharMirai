// Server Component — stats SSR'd at request time, no client-side waterfall
import { AboutContent } from "@/components/public/about-content";
import { createClient } from "@/lib/supabase/server";
import { SOCIETY_INFO, STAT_FALLBACKS } from "@/lib/mock-data";

// Revalidate every 60s — keeps stats fresh without a full rebuild
export const revalidate = 60;

async function getStats(): Promise<{ activeMembers: string; eventsOrganised: string }> {
  try {
    const supabase = await createClient();
    const { data } = await (supabase.from("site_settings") as any)
      .select("key,value")
      .in("key", ["public_active_members", "public_events_organised"]);

    if (!data) return { activeMembers: STAT_FALLBACKS.activeMembers, eventsOrganised: STAT_FALLBACKS.eventsOrganised };

    const members = data.find((d: any) => d.key === "public_active_members")?.value;
    const events  = data.find((d: any) => d.key === "public_events_organised")?.value;

    return {
      activeMembers:   members ? (String(members).includes("+") ? String(members) : `${members}+`) : STAT_FALLBACKS.activeMembers,
      eventsOrganised: events  ? (String(events).includes("+")  ? String(events)  : `${events}+`)  : STAT_FALLBACKS.eventsOrganised,
    };
  } catch {
    return { activeMembers: STAT_FALLBACKS.activeMembers, eventsOrganised: STAT_FALLBACKS.eventsOrganised };
  }
}

export default async function AboutPage() {
  const { activeMembers, eventsOrganised } = await getStats();

  return (
    <AboutContent
      activeMembers={activeMembers}
      eventsOrganised={eventsOrganised}
      aboutText={SOCIETY_INFO.aboutText}
    />
  );
}
