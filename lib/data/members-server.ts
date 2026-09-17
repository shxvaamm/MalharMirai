/**
 * Server-side members fetcher.
 * Must NOT be imported by client components — uses the server-only Supabase client.
 *
 * Reads ONLY from club_members (same constraint as useMembers — never reads profiles).
 * Uses the same field mapping as mapRowToMember in the hook so shapes are identical.
 *
 * Returns [] on any error — the client hook will fill in via its own fetch + Realtime.
 * Revalidate: 120s — members change via admin console, not continuously.
 */
import { createClient } from "@/lib/supabase/server";
import { ClubMember } from "@/lib/mock-data";

function mapRowToMember(d: any): ClubMember {
  const initials = d.full_name
    ? d.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "MC";
  return {
    id: d.id,
    full_name: d.full_name || "Member",
    email: d.email || "",
    role:
      d.role === "admin" || d.role === "super_admin"
        ? "admin"
        : d.role === "volunteer"
        ? "volunteer"
        : "member",
    department: d.department || d.departments?.name || "General",
    phone: d.phone || "+91 98765 00000",
    avatar_url: d.avatar_url,
    avatar_initials: initials,
    bio: d.bio || "Active cultural society member.",
    year: d.year || "1st Year",
    specialty: d.specialty || "Official Member",
    socials: {
      instagram: d.instagram || null,
      linkedin: d.linkedin || null,
    },
  };
}

/** Returns true for synthetic credentials-store entries — same guard as the client hook */
function isSyntheticEntry(m: ClubMember): boolean {
  return (
    typeof m.id === "string" &&
    m.id.startsWith("member-") &&
    !m.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  );
}

export async function fetchMembersServer(): Promise<ClubMember[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("club_members") as any).select("*");

    if (error || !data) return [];

    const seenIds = new Set<string>();
    const members: ClubMember[] = [];

    for (const row of data) {
      if (!seenIds.has(row.id)) {
        seenIds.add(row.id);
        const member = mapRowToMember(row);
        if (!isSyntheticEntry(member)) {
          members.push(member);
        }
      }
    }

    return members;
  } catch {
    return [];
  }
}
