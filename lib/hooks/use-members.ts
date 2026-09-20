"use client";

/**
 * useMembers — public-facing member list hook
 *
 * DATA SOURCE: public.club_members ONLY.
 *
 * INTENTIONAL DESIGN DECISIONS (do not revert):
 * ─────────────────────────────────────────────
 * 1. NEVER reads from public.profiles.
 *    profiles gets a row for every auth signup (Supabase trigger handle_new_user_signup).
 *    Showing profiles rows publicly would expose every registered user on the Team page.
 *    The admin-curated club_members table is the sole source of truth for public display.
 *
 * 2. The localStorage cache (malhar_synced_members) uses a version key (MEMBERS_CACHE_V).
 *    Any cache written by an older version is wiped on first load so existing browsers
 *    with stale/polluted data (profiles rows merged in) are cleaned up automatically.
 *
 * 3. Synthetic member IDs prefixed "member-" (written by credentials-store.ts for the
 *    admin role-sync system) are treated as cache pollution and skipped.
 *
 * 4. The Supabase write always runs regardless of result length, so an empty club_members
 *    table clears a previously-populated stale cache rather than keeping it.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClubMember, MOCK_MEMBERS } from "@/lib/mock-data";
import {
  getSyncedData,
  setSyncedData,
  STORAGE_KEYS,
  subscribeSync,
} from "@/lib/store/sync-store";
import { isSuperAdminEmail } from "@/lib/auth/rbac";

// ─── Cache version ────────────────────────────────────────────────────────────
// Bump this string whenever the schema of what belongs in the members cache
// changes. Any browser holding an older version's data will have it wiped on
// the next page load and replaced with a fresh Supabase fetch.
const MEMBERS_CACHE_V = "v2-club-members-only";
const MEMBERS_CACHE_VERSION_KEY = "malhar_members_cache_version";

/**
 * Returns true if the browser's malhar_synced_members cache is from the current
 * schema version. If false, the caller should wipe and refetch.
 */
function isCacheVersionCurrent(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(MEMBERS_CACHE_VERSION_KEY) === MEMBERS_CACHE_V;
  } catch {
    return false;
  }
}

function stampCacheVersion(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MEMBERS_CACHE_VERSION_KEY, MEMBERS_CACHE_V);
  } catch {}
}

function wipeMembersCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("malhar_synced_members");
    localStorage.setItem(MEMBERS_CACHE_VERSION_KEY, MEMBERS_CACHE_V);
  } catch {}
}

/**
 * Returns true if a cached member entry looks like it was synthetically generated
 * by credentials-store.ts (those entries use the "member-{email}" ID prefix and
 * have placeholder department/bio values rather than real admin-entered data).
 */
function isSyntheticEntry(m: ClubMember): boolean {
  return (
    typeof m.id === "string" &&
    m.id.startsWith("member-") &&
    !m.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  );
}

function mapRowToMember(d: any, cachedMatch?: ClubMember): ClubMember {
  const initials = d.full_name
    ? d.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "MC";
  return {
    id: d.id,
    full_name: d.full_name || cachedMatch?.full_name || "Member",
    email: d.email || cachedMatch?.email || "",
    role:
      d.role === "admin" || d.role === "super_admin"
        ? "admin"
        : d.role === "volunteer"
        ? "volunteer"
        : cachedMatch?.role || "member",
    department: d.department || d.departments?.name || cachedMatch?.department || "General",
    phone: d.phone || cachedMatch?.phone || "+91 98765 00000",
    avatar_url: d.avatar_url || cachedMatch?.avatar_url,
    avatar_initials: initials,
    bio: d.bio ?? (cachedMatch?.bio ?? ""),
    year: d.year || cachedMatch?.year || "1st Year",
    specialty: d.specialty ?? (cachedMatch?.specialty ?? ""),
    socials: {
      instagram: d.instagram || cachedMatch?.socials?.instagram || null,
      linkedin: d.linkedin || cachedMatch?.socials?.linkedin || null,
    },
  };
}

export function useMembers(roleFilter?: string, departmentFilter?: string, searchQuery?: string) {
  const [allMembers, setAllMembers] = useState<ClubMember[]>(MOCK_MEMBERS);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const supabase = createClient();

      // Only fetch from club_members — the admin-curated public member directory.
      // public.profiles is intentionally excluded: it receives a row for EVERY
      // auth signup (via the handle_new_user_signup trigger) and must never be
      // used as a public member list. Admins add people via the admin console,
      // which writes directly to club_members.
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));

      const clubResult = await Promise.race([
        (supabase.from("club_members") as any).select("*"),
        timeout.then(() => ({ data: null })),
      ]);

      // If the query timed out, don't wipe the cache — just bail
      if (!clubResult || !("data" in clubResult)) return;

      const clubRows: any[] = clubResult.data || [];

      const seenIds = new Set<string>();
      const merged: ClubMember[] = [];

      for (const row of clubRows) {
        if (!seenIds.has(row.id)) {
          seenIds.add(row.id);
          merged.push(mapRowToMember(row));
        }
      }

      // Always write back — even for empty results — so a stale cache is
      // overwritten rather than kept when club_members legitimately has 0 rows.
      setAllMembers(merged);
      setSyncedData(STORAGE_KEYS.MEMBERS, merged);
      stampCacheVersion();
    } catch {
      // Keep existing state on network error
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Mount effect: version-gate the cache before using it ─────────────────
  useEffect(() => {
    if (!isCacheVersionCurrent()) {
      // Wipe the stale/polluted cache immediately so nothing bad renders
      wipeMembersCache();
      setAllMembers(MOCK_MEMBERS); // start from empty while fetch runs
    } else {
      // Cache is from the current schema: use it for the instant render,
      // but filter out any synthetic credentials-store entries just in case
      const cached = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
      const clean = cached.filter((m) => !isSyntheticEntry(m));
      if (clean.length > 0) setAllMembers(clean);
    }

    fetchMembers();
  }, [fetchMembers]);

  // ── Same-browser sync (admin console → public page in same browser) ────────
  useEffect(() => {
    return subscribeSync<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS, (updated) => {
      // Filter out synthetic entries on every sync event too
      const clean = updated.filter((m) => !isSyntheticEntry(m));
      setAllMembers(clean);
    });
  }, []);

  // ── Supabase Realtime — cross-device, any browser, Incognito ──────────────
  useEffect(() => {
    const supabase = createClient();

    // Listen on club_members only (profiles is excluded from the public member list)
    const channel = supabase
      .channel("realtime:members:club")
      .on("postgres_changes", { event: "*", schema: "public", table: "club_members" }, () => {
        fetchMembers();
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [fetchMembers]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  let members = [...allMembers];
  if (roleFilter && roleFilter !== "all") {
    if (roleFilter === "admin") {
      members = members.filter((m) => m.role === "admin" || isSuperAdminEmail(m.email));
    } else if (roleFilter === "volunteer") {
      members = members.filter((m) => m.role === "volunteer");
    } else if (roleFilter === "member") {
      members = members.filter((m) => m.role === "member" && !isSuperAdminEmail(m.email));
    } else {
      members = members.filter((m) => m.role === roleFilter);
    }
  }
  if (departmentFilter && departmentFilter !== "all") {
    members = members.filter((m) =>
      m.department.toLowerCase().includes(departmentFilter.toLowerCase())
    );
  }
  if (searchQuery && searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    members = members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }

  return { members, loading, refresh: fetchMembers };
}
