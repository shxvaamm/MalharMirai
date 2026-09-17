/**
 * Server-side announcements fetcher.
 * Must NOT be imported by client components — uses the server-only Supabase client.
 *
 * Used by both layout.tsx (for EmergencyBanner hydration) and announcements/page.tsx.
 * Returns [] on any error — the client hook fills in via its own fetch + Realtime.
 * Revalidate: 60s — announcements can be time-sensitive emergency alerts.
 */
import { createClient } from "@/lib/supabase/server";
import { Announcement } from "@/lib/mock-data";

export async function fetchAnnouncementsServer(): Promise<Announcement[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("announcements") as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return (data as any[]).map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      priority: d.priority || "normal",
      is_emergency: !!d.is_emergency,
      created_at: d.created_at,
      category: d.priority === "urgent" ? "Urgent Update" : "General Circular",
    }));
  } catch {
    return [];
  }
}
