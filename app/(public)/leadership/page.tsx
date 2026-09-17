import { fetchMembersServer } from "@/lib/data/members-server";
import { LeadershipContent } from "@/components/public/leadership-content";

// Revalidate every 2 minutes — members change via admin console, not continuously
export const revalidate = 120;

export default async function LeadershipPage() {
  const initialMembers = await fetchMembersServer();
  return <LeadershipContent initialMembers={initialMembers} />;
}
