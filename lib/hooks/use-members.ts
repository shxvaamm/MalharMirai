"use client";

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
    bio: d.bio || cachedMatch?.bio || "Active cultural society member.",
    year: d.year || cachedMatch?.year || "1st Year",
    specialty: d.specialty || cachedMatch?.specialty || "Official Member",
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
      const cached = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
      if (cached && cached.length > 0) setAllMembers(cached);

      const supabase = createClient();

      // Fetch from BOTH tables and merge — club_members has admin-added people (no FK)
      // profiles has people who registered via auth
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));

      const [clubResult, profilesResult] = await Promise.all([
        Promise.race([
          (supabase.from("club_members") as any).select("*"),
          timeout.then(() => ({ data: null })),
        ]),
        Promise.race([
          (supabase.from("profiles") as any).select("*"),
          timeout.then(() => ({ data: null })),
        ]),
      ]);

      const clubRows: any[] = clubResult?.data || [];
      const profileRows: any[] = profilesResult?.data || [];

      // Merge: club_members wins (has all data), deduplicate by email
      const seenEmails = new Set<string>();
      const seenIds = new Set<string>();
      const merged: ClubMember[] = [];

      for (const row of clubRows) {
        const email = (row.email || "").toLowerCase();
        if (!seenIds.has(row.id) && !seenEmails.has(email)) {
          seenIds.add(row.id);
          if (email) seenEmails.add(email);
          const cachedMatch = cached.find((c) => c.id === row.id || c.email?.toLowerCase() === email);
          merged.push(mapRowToMember(row, cachedMatch));
        }
      }

      for (const row of profileRows) {
        const email = (row.email || "").toLowerCase();
        if (!seenIds.has(row.id) && !seenEmails.has(email)) {
          seenIds.add(row.id);
          if (email) seenEmails.add(email);
          const cachedMatch = cached.find((c) => c.id === row.id || c.email?.toLowerCase() === email);
          merged.push(mapRowToMember(row, cachedMatch));
        }
      }

      if (merged.length > 0) {
        setAllMembers(merged);
        setSyncedData(STORAGE_KEYS.MEMBERS, merged);
      }
    } catch {
      // Keep cached members on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
    if (cached && cached.length > 0) setAllMembers(cached);
    fetchMembers();
  }, [fetchMembers]);

  // Same-browser sync
  useEffect(() => {
    return subscribeSync<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS, (updated) => {
      setAllMembers(updated);
    });
  }, []);

  // ✅ Supabase Realtime — cross-device, any browser, Incognito
  useEffect(() => {
    const supabase = createClient();

    // Listen on BOTH tables for changes
    const channel = supabase
      .channel("realtime:members:both")
      .on("postgres_changes", { event: "*", schema: "public", table: "club_members" }, () => {
        fetchMembers();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchMembers();
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [fetchMembers]);

  // --- Filtering ---
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
