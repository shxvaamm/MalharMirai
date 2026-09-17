// Server Component — stats SSR'd at request time, no client-side waterfall
import { AboutContent } from "@/components/public/about-content";
import { SOCIETY_INFO } from "@/lib/mock-data";
import { getLivePublicStats } from "@/lib/queries/stats";

// Revalidate every 60s — keeps stats fresh without a full rebuild
export const revalidate = 60;

export default async function AboutPage() {
  const { activeMembers, eventsOrganised } = await getLivePublicStats();

  return (
    <AboutContent
      activeMembers={activeMembers}
      eventsOrganised={eventsOrganised}
      aboutText={SOCIETY_INFO.aboutText}
    />
  );
}
