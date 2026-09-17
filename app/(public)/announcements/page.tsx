import * as React from "react";
import { fetchAnnouncementsServer } from "@/lib/data/announcements-server";
import { AnnouncementsContent } from "@/components/public/announcements-content";

// Revalidate every 60s — announcements can be time-sensitive
export const revalidate = 60;

export default async function AnnouncementsPage() {
  const initialAnnouncements = await fetchAnnouncementsServer();
  return <AnnouncementsContent initialAnnouncements={initialAnnouncements} />;
}
