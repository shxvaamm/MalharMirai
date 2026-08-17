"use client";

import * as React from "react";
import {
  ClubEvent,
  ClubMember,
  Department,
  Announcement,
  GalleryMedia,
  ClubStats,
  HeroSlide,
  MOCK_EVENTS,
  MOCK_MEMBERS,
  OFFICIAL_DEPARTMENTS,
  MOCK_DEPARTMENTS,
  MOCK_ANNOUNCEMENTS,
  MOCK_GALLERY,
  DEFAULT_HERO_SLIDES,
  DEFAULT_CLUB_STATS,
} from "@/lib/mock-data";

import { createClient } from "@/lib/supabase/client";
import {
  getSyncedData,
  setSyncedData,
  STORAGE_KEYS,
  SYNC_EVENT_NAME,
} from "@/lib/store/sync-store";
import { updateClubStatsAction } from "@/lib/actions/stats";
import { createMemberAction, updateMemberAction, deleteMemberAction } from "@/lib/actions/members";
import { createEventAction, updateEventAction, deleteEventAction } from "@/lib/actions/events";
import { createDepartmentAction, updateDepartmentAction, deleteDepartmentAction } from "@/lib/actions/departments";
import { postAnnouncementAction, deleteAnnouncementAction } from "@/lib/actions/announcements";
import { uploadGalleryMediaAction, deleteGalleryMediaAction } from "@/lib/actions/gallery";

export interface StudentRegistration {
  id: string;
  event_id: string;
  event_title: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  registered_at: string;
  department?: string;
  year?: string;
}

const INITIAL_REGISTRATIONS: StudentRegistration[] = [];


function isValidUUID(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function generateSafeUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useAdminData() {
  const [events, setEvents] = React.useState<ClubEvent[]>(() => {
    if (typeof window !== "undefined") return getSyncedData(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
    return MOCK_EVENTS;
  });
  const [members, setMembers] = React.useState<ClubMember[]>(() => {
    if (typeof window !== "undefined") return getSyncedData(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
    return MOCK_MEMBERS;
  });
  const [departments, setDepartments] = React.useState<Department[]>(() => {
    if (typeof window !== "undefined") return getSyncedData(STORAGE_KEYS.DEPARTMENTS, MOCK_DEPARTMENTS);
    return MOCK_DEPARTMENTS;
  });
  const [announcements, setAnnouncements] = React.useState<Announcement[]>(() => {
    if (typeof window !== "undefined") return getSyncedData(STORAGE_KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS);
    return MOCK_ANNOUNCEMENTS;
  });
  const [gallery, setGallery] = React.useState<GalleryMedia[]>(() => {
    if (typeof window !== "undefined") return getSyncedData(STORAGE_KEYS.GALLERY, MOCK_GALLERY);
    return MOCK_GALLERY;
  });
  const [stats, setStats] = React.useState<ClubStats>(() => {
    if (typeof window !== "undefined") return getSyncedData(STORAGE_KEYS.STATS, DEFAULT_CLUB_STATS);
    return DEFAULT_CLUB_STATS;
  });
  const [registrations, setRegistrations] = React.useState<StudentRegistration[]>(() => {
    if (typeof window !== "undefined") return getSyncedData(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    return INITIAL_REGISTRATIONS;
  });
  const [heroSlides, setHeroSlides] = React.useState<HeroSlide[]>(() => {
    if (typeof window !== "undefined") return getSyncedData(STORAGE_KEYS.HERO_SLIDES, DEFAULT_HERO_SLIDES);
    return DEFAULT_HERO_SLIDES;
  });
  const [loading, setLoading] = React.useState(false);




  // Sync with Supabase on mount
  React.useEffect(() => {
    async function loadSupabaseData() {
      try {
        const supabase = createClient();
        const queriesPromise = Promise.all([
          (supabase.from("events") as any).select("*"),
          (supabase.from("club_members") as any).select("*"),  // PRIMARY: admin-added members (no FK)
          (supabase.from("profiles") as any).select("*"),      // SECONDARY: auth users
          (supabase.from("departments") as any).select("*"),
          (supabase.from("announcements") as any).select("*"),
          (supabase.from("gallery") as any).select("*"),
          (supabase.from("registrations") as any).select("*"),
          (supabase.from("hero_slides") as any).select("*").order("sort_order", { ascending: true }),
        ]);

        const timeoutPromise = new Promise<any[]>((resolve) =>
          setTimeout(() => resolve([{ data: null }, { data: null }, { data: null }, { data: null }, { data: null }, { data: null }, { data: null }, { data: null }]), 2000)
        );

        const [
          { data: evData },
          { data: clubMembersData },
          { data: profData },
          { data: deptData },
          { data: annData },
          { data: galData },
          { data: regData },
          { data: heroData },
        ] = await Promise.race([queriesPromise, timeoutPromise]);

        if (evData && evData.length > 0) {
          const mappedEvents = evData.map((d: any) => ({
            id: d.id,
            title: d.title || "",
            description: d.description || "",
            category: d.category || "Festival",
            date_time: d.date_time || new Date().toISOString(),
            venue: d.venue || "Campus Auditorium",
            poster_url: d.poster_url || MOCK_EVENTS[0].poster_url,
            max_capacity: d.max_capacity || 300,
            registered_count: d.registered_count ?? (regData?.filter((r: any) => r.event_id === d.id)?.length || 0),
            status: d.status || "upcoming",
            registration_deadline: d.registration_deadline || new Date(Date.now() + 86400000 * 7).toISOString(),
            rules: Array.isArray(d.rules) && d.rules.length > 0 ? d.rules : ["Valid Mirai Student Registration Pass required.", "Report 20 mins early."],
            prizes: Array.isArray(d.prizes) && d.prizes.length > 0 ? d.prizes : ["1st Prize: Malhar Cultural Trophy", "2nd Prize: Certificate of Distinction"],
          }));
          setEvents(mappedEvents);
          setSyncedData(STORAGE_KEYS.EVENTS, mappedEvents);
        }

        if (deptData && deptData.length > 0) {
          const merged = OFFICIAL_DEPARTMENTS.map((official) => {
            const match = deptData.find(
              (d: any) =>
                d.name?.toLowerCase().includes(official.name.toLowerCase().split(" ")[0]) ||
                official.name.toLowerCase().includes(d.name?.toLowerCase() || "")
            );
            if (match) {
              return {
                ...official,
                id: match.id || official.id,
                description: match.description || official.description,
              };
            }
            return official;
          });
          setDepartments(merged);
          setSyncedData(STORAGE_KEYS.DEPARTMENTS, merged);
        } else {
          setDepartments(OFFICIAL_DEPARTMENTS);
          setSyncedData(STORAGE_KEYS.DEPARTMENTS, OFFICIAL_DEPARTMENTS);
        }


        if (clubMembersData && clubMembersData.length > 0) {
          const cached = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
          const mapRow = (d: any, cachedMatch?: ClubMember): ClubMember => {
            const initials = d.full_name
              ? d.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
              : "MC";
            return {
              id: d.id,
              full_name: d.full_name || cachedMatch?.full_name || "Member",
              email: d.email || cachedMatch?.email || "",
              role: d.role === "super_admin" || d.role === "admin" ? "admin" : d.role === "volunteer" ? "volunteer" : (cachedMatch?.role || "member"),
              department: d.department || d.departments?.name || cachedMatch?.department || "General",
              phone: d.phone || cachedMatch?.phone || "+91 98765 00000",
              avatar_url: d.avatar_url || cachedMatch?.avatar_url,
              avatar_initials: initials,
              bio: d.bio || cachedMatch?.bio || "Active cultural society member.",
              year: d.year || cachedMatch?.year || "1st Year",
              specialty: d.specialty || cachedMatch?.specialty || "Official Member",
              socials: { instagram: d.instagram || cachedMatch?.socials?.instagram || null, linkedin: d.linkedin || cachedMatch?.socials?.linkedin || null },
            };
          };

          // Merge club_members (primary) + profiles (secondary for auth users)
          const seenIds = new Set<string>();
          const seenEmails = new Set<string>();
          const merged: ClubMember[] = [];

          for (const d of clubMembersData) {
            const email = (d.email || "").toLowerCase();
            if (!seenIds.has(d.id) && !seenEmails.has(email)) {
              seenIds.add(d.id);
              if (email) seenEmails.add(email);
              const cachedMatch = cached.find((c) => c.id === d.id || c.email?.toLowerCase() === email);
              merged.push(mapRow(d, cachedMatch));
            }
          }

          if (profData && profData.length > 0) {
            for (const d of profData) {
              const email = (d.email || "").toLowerCase();
              if (!seenIds.has(d.id) && !seenEmails.has(email)) {
                seenIds.add(d.id);
                if (email) seenEmails.add(email);
                const cachedMatch = cached.find((c) => c.id === d.id || c.email?.toLowerCase() === email);
                merged.push(mapRow(d, cachedMatch));
              }
            }
          }

          // Also include any local-only members not yet saved to DB
          for (const c of cached) {
            if (!seenIds.has(c.id) && !seenEmails.has(c.email.toLowerCase())) {
              merged.push(c);
            }
          }

          setMembers(merged);
          setSyncedData(STORAGE_KEYS.MEMBERS, merged);
        } else if (profData && profData.length > 0) {
          // Fallback: only profiles available
          const cached = getSyncedData<ClubMember[]>(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
          const mappedProfs: ClubMember[] = profData.map((d: any) => {
            const initials = d.full_name ? d.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "MC";
            const cachedMatch = cached.find((c) => c.id === d.id || (d.email && c.email?.toLowerCase() === d.email.toLowerCase()));
            return {
              id: d.id, full_name: d.full_name || cachedMatch?.full_name || "Member",
              email: d.email || cachedMatch?.email || "",
              role: d.role === "super_admin" || d.role === "admin" ? "admin" : d.role === "volunteer" ? "volunteer" : (cachedMatch?.role || "member"),
              department: d.department || d.departments?.name || cachedMatch?.department || "General",
              phone: d.phone || cachedMatch?.phone || "+91 98765 00000",
              avatar_url: d.avatar_url || cachedMatch?.avatar_url,
              avatar_initials: initials,
              bio: d.bio || cachedMatch?.bio || "Active cultural society member.",
              year: d.year || cachedMatch?.year || "1st Year",
              specialty: d.specialty || cachedMatch?.specialty || "Official Member",
              socials: { instagram: d.instagram || cachedMatch?.socials?.instagram || null, linkedin: d.linkedin || cachedMatch?.socials?.linkedin || null },
            };
          });
          setMembers(mappedProfs);
          setSyncedData(STORAGE_KEYS.MEMBERS, mappedProfs);
        }


        if (annData && annData.length > 0) {
          const mappedAnns = annData.map((d: any) => ({
            id: d.id,
            title: d.title,
            content: d.content,
            priority: d.priority || "normal",
            is_emergency: !!d.is_emergency,
            created_at: d.created_at,
          }));
          setAnnouncements(mappedAnns);
          setSyncedData(STORAGE_KEYS.ANNOUNCEMENTS, mappedAnns);
        }

        if (galData && galData.length > 0) {
          const mappedGal = galData.map((d: any) => ({
            id: d.id,
            title: d.title,
            media_url: d.media_url,
            media_type: d.media_type || "image",
            category: d.category || "general",
            date: "2026",
            event_title: "Mirai Cultural Showcase",
          }));
          setGallery(mappedGal);
          setSyncedData(STORAGE_KEYS.GALLERY, mappedGal);
        }

        // Load hero slides from DB
        if (heroData && heroData.length > 0) {
          const mappedHero: HeroSlide[] = heroData.map((d: any) => ({
            id: d.id,
            image_url: d.image_url,
            title: d.title || "",
            caption: d.subtitle || d.caption || "",
            order: d.sort_order ?? 0,
            is_active: d.is_active !== false,
            created_at: d.created_at,
          }));
          setHeroSlides(Array.from(new Map(mappedHero.map((s) => [s.id, s])).values()));
          setSyncedData(STORAGE_KEYS.HERO_SLIDES, mappedHero);
        }

        // Fetch club stats from Supabase site_settings and club_stats
        const { data: settingsData } = await (supabase.from("site_settings") as any)
          .select("key, value")
          .in("key", ["public_active_members", "public_events_organised", "active_members", "events_organised"]);

        let remoteAct: number | null = null;
        let remoteEv: number | null = null;

        if (settingsData && settingsData.length > 0) {
          const actVal = settingsData.find((s: any) => s.key === "public_active_members" || s.key === "active_members")?.value;
          const evVal = settingsData.find((s: any) => s.key === "public_events_organised" || s.key === "events_organised")?.value;
          if (actVal !== undefined && !isNaN(Number(actVal))) remoteAct = Number(actVal);
          if (evVal !== undefined && !isNaN(Number(evVal))) remoteEv = Number(evVal);
        }

        if (remoteAct === null || remoteEv === null) {
          const { data: statsData } = await (supabase.from("club_stats") as any).select("*").maybeSingle();
          if (statsData) {
            if (remoteAct === null && statsData.active_members !== undefined) remoteAct = Number(statsData.active_members);
            if (remoteEv === null && statsData.events_organised !== undefined) remoteEv = Number(statsData.events_organised);
          }
        }

        if (remoteAct !== null || remoteEv !== null) {
          const cachedSt = getSyncedData(STORAGE_KEYS.STATS, DEFAULT_CLUB_STATS);
          const loadedStats: ClubStats = {
            activeMembers: remoteAct ?? cachedSt.activeMembers,
            eventsOrganised: remoteEv ?? cachedSt.eventsOrganised,
          };
          setStats(loadedStats);
          setSyncedData(STORAGE_KEYS.STATS, loadedStats);
        }
      } catch (err) {
        console.warn("Supabase local sync: using resilient active state.");
      }
    }

    loadSupabaseData();

    // Set up Realtime subscription across all administrative tables
    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel("admin_all_tables_realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "club_members" }, () => loadSupabaseData())
        .on("postgres_changes", { event: "*", schema: "public", table: "hero_slides" }, () => loadSupabaseData())
        .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => loadSupabaseData())
        .on("postgres_changes", { event: "*", schema: "public", table: "club_stats" }, () => loadSupabaseData())
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => loadSupabaseData())
        .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => loadSupabaseData())
        .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => loadSupabaseData())
        .on("postgres_changes", { event: "*", schema: "public", table: "gallery" }, () => loadSupabaseData())
        .on("postgres_changes", { event: "*", schema: "public", table: "departments" }, () => loadSupabaseData())
        .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, () => loadSupabaseData())
        .subscribe();
    } catch {}

    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, []);

  // Listen to cross-tab updates and rehydrate on mount
  React.useEffect(() => {
    // 1. Immediately rehydrate from client storage upon mount
    const cachedEvents = getSyncedData(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
    const cachedMembers = getSyncedData(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
    setEvents(cachedEvents);
    setDepartments(getSyncedData(STORAGE_KEYS.DEPARTMENTS, MOCK_DEPARTMENTS));
    setMembers(cachedMembers);
    setAnnouncements(getSyncedData(STORAGE_KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS));
    setGallery(getSyncedData(STORAGE_KEYS.GALLERY, MOCK_GALLERY));
    setRegistrations(getSyncedData(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS));
    // Respect cached stats from sync store directly
    const cachedStats = getSyncedData(STORAGE_KEYS.STATS, DEFAULT_CLUB_STATS);
    setStats(cachedStats);
    const initialHero = getSyncedData(STORAGE_KEYS.HERO_SLIDES, DEFAULT_HERO_SLIDES);
    setHeroSlides(Array.from(new Map(initialHero.map((s: any) => [s.id, s])).values()));

    const handleSync = (e: any) => {
      const key = e?.detail?.key || e?.key;
      if (!key || key === STORAGE_KEYS.EVENTS) {
        const evs = getSyncedData(STORAGE_KEYS.EVENTS, MOCK_EVENTS);
        setEvents(evs);
      }
      if (!key || key === STORAGE_KEYS.DEPARTMENTS) {
        setDepartments(getSyncedData(STORAGE_KEYS.DEPARTMENTS, MOCK_DEPARTMENTS));
      }
      if (!key || key === STORAGE_KEYS.MEMBERS) {
        const mems = getSyncedData(STORAGE_KEYS.MEMBERS, MOCK_MEMBERS);
        setMembers(mems);
      }
      if (!key || key === STORAGE_KEYS.ANNOUNCEMENTS) {
        setAnnouncements(getSyncedData(STORAGE_KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS));
      }
      if (!key || key === STORAGE_KEYS.GALLERY) {
        setGallery(getSyncedData(STORAGE_KEYS.GALLERY, MOCK_GALLERY));
      }
      if (!key || key === STORAGE_KEYS.STATS) {
        setStats(getSyncedData(STORAGE_KEYS.STATS, DEFAULT_CLUB_STATS));
      }
      if (!key || key === STORAGE_KEYS.REGISTRATIONS) {
        setRegistrations(getSyncedData(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS));
      }
      if (!key || key === STORAGE_KEYS.HERO_SLIDES) {
        const syncedHero = getSyncedData(STORAGE_KEYS.HERO_SLIDES, DEFAULT_HERO_SLIDES);
        setHeroSlides(Array.from(new Map(syncedHero.map((s: any) => [s.id, s])).values()));
      }
    };

    window.addEventListener(SYNC_EVENT_NAME, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // ===================== DYNAMIC STATS MUTATIONS =====================
  const updateStats = async (newStats: Partial<ClubStats>) => {
    const current = getSyncedData(STORAGE_KEYS.STATS, DEFAULT_CLUB_STATS);
    const updated = { ...current, ...newStats };
    setStats(updated);
    setSyncedData(STORAGE_KEYS.STATS, updated);

    // 1. Direct Supabase site_settings and club_stats writes
    try {
      const supabase = createClient();
      const settingsUpserts = [];
      if (updated.activeMembers !== undefined) {
        settingsUpserts.push(
          { key: "public_active_members", value: String(updated.activeMembers), updated_at: new Date().toISOString() },
          { key: "active_members", value: String(updated.activeMembers), updated_at: new Date().toISOString() }
        );
      }
      if (updated.eventsOrganised !== undefined) {
        settingsUpserts.push(
          { key: "public_events_organised", value: String(updated.eventsOrganised), updated_at: new Date().toISOString() },
          { key: "events_organised", value: String(updated.eventsOrganised), updated_at: new Date().toISOString() }
        );
      }
      if (settingsUpserts.length > 0) {
        await (supabase.from("site_settings") as any).upsert(settingsUpserts, { onConflict: "key" });
      }

      await (supabase.from("club_stats") as any).upsert({
        id: "current",
        active_members: updated.activeMembers,
        events_organised: updated.eventsOrganised,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    } catch (e) {
      console.warn("Stats updated in local resilient state");
    }

    // 2. Revalidate server pages so fresh SSR renders have updated stats
    try {
      await updateClubStatsAction(updated);
    } catch (_) {}
  };

  // ===================== DEDUPLICATED STATE APPORTERS =====================
  const addMemberToState = (newMember: ClubMember) => {
    setMembers((prev) => {
      const existsIndex = prev.findIndex(
        (m) =>
          m.id === newMember.id ||
          (m.email && newMember.email && m.email.toLowerCase() === newMember.email.toLowerCase())
      );
      const updated = existsIndex >= 0
        ? prev.map((m, idx) => (idx === existsIndex ? { ...m, ...newMember } : m))
        : [newMember, ...prev];
      setSyncedData(STORAGE_KEYS.MEMBERS, updated);
      return updated;
    });
  };

  const addEventToState = (newEvent: ClubEvent) => {
    setEvents((prev) => {
      const existsIndex = prev.findIndex(
        (e) =>
          e.id === newEvent.id ||
          (e.title && newEvent.title && e.title.toLowerCase() === newEvent.title.toLowerCase())
      );
      const updated = existsIndex >= 0
        ? prev.map((e, idx) => (idx === existsIndex ? { ...e, ...newEvent } : e))
        : [newEvent, ...prev];
      setSyncedData(STORAGE_KEYS.EVENTS, updated);
      return updated;
    });
  };

  const addDepartmentToState = (newDept: Department) => {
    setDepartments((prev) => {
      const existsIndex = prev.findIndex(
        (d) =>
          d.id === newDept.id ||
          (d.name && newDept.name && d.name.toLowerCase() === newDept.name.toLowerCase())
      );
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = { ...updated[existsIndex], ...newDept };
        setSyncedData(STORAGE_KEYS.DEPARTMENTS, updated);
        return updated;
      }
      const updated = [newDept, ...prev];
      setSyncedData(STORAGE_KEYS.DEPARTMENTS, updated);
      return updated;
    });
  };

  const addAnnouncementToState = (newAnn: Announcement) => {
    setAnnouncements((prev) => {
      const existsIndex = prev.findIndex(
        (a) =>
          a.id === newAnn.id ||
          (a.title && newAnn.title && a.title.toLowerCase() === newAnn.title.toLowerCase() && a.content === newAnn.content)
      );
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = { ...updated[existsIndex], ...newAnn };
        setSyncedData(STORAGE_KEYS.ANNOUNCEMENTS, updated);
        return updated;
      }
      const updated = [newAnn, ...prev];
      setSyncedData(STORAGE_KEYS.ANNOUNCEMENTS, updated);
      return updated;
    });
  };

  const addGalleryMediaToState = (newGal: GalleryMedia) => {
    setGallery((prev) => {
      const existsIndex = prev.findIndex(
        (g) => g.id === newGal.id || (g.media_url && g.media_url === newGal.media_url)
      );
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = { ...updated[existsIndex], ...newGal };
        setSyncedData(STORAGE_KEYS.GALLERY, updated);
        return updated;
      }
      const updated = [newGal, ...prev];
      setSyncedData(STORAGE_KEYS.GALLERY, updated);
      return updated;
    });
  };

  // ===================== EVENT MUTATIONS & DYNAMIC REGISTRATION =====================
  const createEvent = async (newEvent: Omit<ClubEvent, "id" | "registered_count">) => {
    const id = generateSafeUUID();
    const fullEvent: ClubEvent = {
      ...newEvent,
      id,
      registered_count: 0,
      rules: newEvent.rules || ["Valid Mirai Student Registration Pass required.", "Report 20 mins early."],
      prizes: newEvent.prizes || ["1st Prize: Malhar Cultural Trophy", "2nd Prize: Certificate of Distinction"],
    };

    addEventToState(fullEvent);

    try {
      const supabase = createClient();
      await (supabase.from("events") as any).insert({
        id,
        title: newEvent.title,
        description: newEvent.description,
        category: newEvent.category,
        date_time: newEvent.date_time,
        venue: newEvent.venue,
        poster_url: newEvent.poster_url,
        max_capacity: newEvent.max_capacity,
        status: newEvent.status,
        registration_deadline: newEvent.registration_deadline,
      });
    } catch (e) {
      console.warn("Event created in local state");
    }

    // Call privileged server action for SSR revalidation & RLS bypass
    try {
      createEventAction({
        title: newEvent.title,
        description: newEvent.description,
        category: newEvent.category,
        date_time: newEvent.date_time,
        venue: newEvent.venue,
        poster_url: newEvent.poster_url,
        max_capacity: newEvent.max_capacity,
        status: newEvent.status,
        registration_deadline: newEvent.registration_deadline,
        rules: newEvent.rules,
        prizes: newEvent.prizes,
      }).catch(() => {});
    } catch {}

    return fullEvent;
  };

  const updateEvent = async (id: string, updates: Partial<ClubEvent>) => {
    setEvents((prev) => {
      const updated = prev.map((ev) => (ev.id === id ? { ...ev, ...updates } : ev));
      setSyncedData(STORAGE_KEYS.EVENTS, updated);
      return updated;
    });

    if (isValidUUID(id)) {
      try {
        const supabase = createClient();
        await (supabase.from("events") as any).update(updates).eq("id", id);
      } catch (e) {
        console.warn("Event updated in local state");
      }

      try {
        updateEventAction(id, updates as any).catch(() => {});
      } catch {}
    }
  };

  const deleteEvent = async (id: string) => {
    setEvents((prev) => {
      const updated = prev.filter((ev) => ev.id !== id);
      setSyncedData(STORAGE_KEYS.EVENTS, updated);
      return updated;
    });
    if (isValidUUID(id)) {
      try {
        const supabase = createClient();
        await (supabase.from("events") as any).delete().eq("id", id);
      } catch (e) {
        console.warn("Event deleted in local state");
      }

      try {
        deleteEventAction(id).catch(() => {});
      } catch {}
    }
  };

  const registerStudentForEvent = async (regInput: Omit<StudentRegistration, "id" | "registered_at">) => {
    const targetEvent = events.find((ev) => ev.id === regInput.event_id);
    if (targetEvent) {
      const isPast =
        targetEvent.status === "completed" ||
        new Date(targetEvent.date_time).getTime() < Date.now();
      const isDeadlinePassed = targetEvent.registration_deadline
        ? new Date(targetEvent.registration_deadline).getTime() < Date.now()
        : false;
      if (isPast || isDeadlinePassed) {
        throw new Error("Registration is closed for this completed or past event.");
      }
      if ((targetEvent.registered_count || 0) >= (targetEvent.max_capacity || 300)) {
        throw new Error("Event has reached maximum capacity.");
      }
    }

    const regId = generateSafeUUID();
    const newReg: StudentRegistration = {
      ...regInput,
      id: regId,
      registered_at: new Date().toISOString(),
    };


    // 1. Add to registrations state and persist to syncStore
    setRegistrations((prev) => {
      const updated = [newReg, ...prev];
      setSyncedData(STORAGE_KEYS.REGISTRATIONS, updated);
      return updated;
    });

    // 2. Increment target event's registered_count dynamically
    setEvents((prev) => {
      const updated = prev.map((ev) =>
        ev.id === regInput.event_id ||
        (ev.title && regInput.event_title && ev.title.trim().toLowerCase() === regInput.event_title.trim().toLowerCase())
          ? { ...ev, registered_count: (ev.registered_count || 0) + 1 }
          : ev
      );
      setSyncedData(STORAGE_KEYS.EVENTS, updated);
      return updated;
    });

    // 3. Persist to Supabase — include ALL columns with safe defaults to avoid NOT NULL failures
    try {
      const supabase = createClient();
      const { error: insertError } = await (supabase.from("registrations") as any).insert({
        id: regId,
        event_id: regInput.event_id || null,
        student_name: regInput.student_name,
        student_email: regInput.student_email,
        student_phone: regInput.student_phone || "",
        department: regInput.department || "",
        year_of_study: regInput.year || "",
        college_id: "",
        status: "confirmed",
      });

      if (insertError) {
        console.warn("[Registration] DB insert error:", insertError.message, insertError.code);
      } else {
        // Increment registered_count in events table
        try {
          const { data: ev } = await (supabase.from("events") as any)
            .select("registered_count")
            .eq("id", regInput.event_id)
            .maybeSingle();
          await (supabase.from("events") as any)
            .update({ registered_count: (ev?.registered_count || 0) + 1 })
            .eq("id", regInput.event_id);
        } catch (e) {
          console.warn("[Registration] Count increment failed:", e);
        }
      }
    } catch (e) {
      console.warn("[Registration] Supabase save failed, data saved locally:", e);
    }

    return newReg;
  };

  // ===================== MEMBER MUTATIONS =====================
  const createMember = async (newMember: Omit<ClubMember, "id" | "avatar_initials">) => {
    const id = generateSafeUUID();
    const initials = (newMember.full_name || "")
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "MC";

    const fullMember: ClubMember = {
      ...newMember,
      id,
      full_name: (newMember.full_name || "").trim(),
      email: (newMember.email || "").trim().toLowerCase(),
      role: newMember.role || "member",
      department: newMember.department || "General",
      phone: newMember.phone || "+91 98765 00000",
      avatar_url: newMember.avatar_url || undefined,
      avatar_initials: initials,
      bio: newMember.bio || `Active member in ${newMember.department || "MALHAR"}`,
      year: newMember.year || "1st Year",
      specialty: newMember.specialty || "Official Member",
      socials: newMember.socials || {},
    };

    addMemberToState(fullMember);

    // Persist to Supabase — include ALL fields so public pages show correct data
    try {
      const supabase = createClient();
      const sanitizedEmail = (newMember.email || "").trim().toLowerCase();

      const insertPayload: any = {
        id,
        full_name: (newMember.full_name || "").trim(),
        email: sanitizedEmail,
        role: newMember.role || "member",
        phone: (newMember.phone || "").trim() || "+91 98765 00000",
        avatar_url: newMember.avatar_url || null,
        bio: newMember.bio || `Active member in ${newMember.department || "MALHAR"}`,
        // Critical: specialty must always be written so leadership/members public pages work
        specialty: newMember.specialty || "Official Member",
        year: newMember.year || "1st Year",
        instagram: newMember.socials?.instagram || null,
        linkedin: newMember.socials?.linkedin || null,
      };

      const { error: insertError } = await (supabase.from("profiles") as any).insert(insertPayload);

      // If extended columns fail, fall back with core + specialty (never drop specialty)
      if (insertError) {
        await (supabase.from("profiles") as any).insert({
          id,
          full_name: insertPayload.full_name,
          email: sanitizedEmail,
          role: insertPayload.role,
          phone: insertPayload.phone,
          avatar_url: insertPayload.avatar_url,
          specialty: insertPayload.specialty,
          year: insertPayload.year,
        });
      }
    } catch (e) {
      console.warn("Member saved to real-time synchronized state.");
    }

    // Also call privileged Server Action for cache revalidation
    try {
      createMemberAction({
        full_name: (newMember.full_name || "").trim(),
        email: (newMember.email || "").trim().toLowerCase(),
        role: (newMember.role as any) || "member",
        department: newMember.department || "General",
        phone: newMember.phone || "+91 98765 00000",
        avatar_url: newMember.avatar_url,
        bio: newMember.bio,
        year: newMember.year,
        specialty: newMember.specialty,
        instagram: newMember.socials?.instagram || undefined,
        linkedin: newMember.socials?.linkedin || undefined,
      }).catch(() => {});
    } catch {}

    return fullMember;
  };

  const updateMember = async (id: string, updates: Partial<ClubMember>) => {
    setMembers((prev) => {
      const updated = prev.map((m) =>
        m.id === id || (updates.email && m.email.toLowerCase() === updates.email.toLowerCase())
          ? { ...m, ...updates }
          : m
      );
      setSyncedData(STORAGE_KEYS.MEMBERS, updated);
      return updated;
    });

    const dbUpdates: Record<string, any> = {};
    if (updates.full_name !== undefined) dbUpdates.full_name = (updates.full_name || "").trim();
    if (updates.email !== undefined) dbUpdates.email = (updates.email || "").trim().toLowerCase();
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.phone !== undefined) dbUpdates.phone = (updates.phone || "").trim();
    if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url || null;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio || "";
    // Always sync specialty, year, and socials so public pages stay in sync
    if (updates.specialty !== undefined) dbUpdates.specialty = updates.specialty || "Official Member";
    if (updates.year !== undefined) dbUpdates.year = updates.year || "";
    if (updates.socials?.instagram !== undefined) dbUpdates.instagram = updates.socials.instagram || null;
    if (updates.socials?.linkedin !== undefined) dbUpdates.linkedin = updates.socials.linkedin || null;

    if (Object.keys(dbUpdates).length > 0) {
      try {
        const supabase = createClient();
        if (isValidUUID(id)) {
          await (supabase.from("profiles") as any).update(dbUpdates).eq("id", id);
        } else if (updates.email) {
          await (supabase.from("profiles") as any)
            .update(dbUpdates)
            .eq("email", updates.email.trim().toLowerCase());
        }
      } catch (e) {
        console.warn("Member updated in synchronized state.");
      }

      if (isValidUUID(id)) {
        try {
          updateMemberAction(id, {
            ...dbUpdates,
            instagram: updates.socials?.instagram || undefined,
            linkedin: updates.socials?.linkedin || undefined,
          }).catch(() => {});
        } catch {}
      }
    }
  };

  const deleteMember = async (id: string, email?: string) => {
    setMembers((prev) => {
      const updated = prev.filter((m) => {
        if (m.id === id) return false;
        if (email && m.email.toLowerCase().trim() === email.toLowerCase().trim()) return false;
        if (id && m.email.toLowerCase().trim() === id.toLowerCase().trim()) return false;
        return true;
      });
      setSyncedData(STORAGE_KEYS.MEMBERS, updated);
      return updated;
    });

    try {
      const supabase = createClient();
      if (isValidUUID(id)) {
        await (supabase.from("profiles") as any).delete().eq("id", id);
      }
      if (email) {
        await (supabase.from("profiles") as any).delete().eq("email", email.toLowerCase().trim());
      }
    } catch (e) {
      console.warn("Member deleted in synchronized state.");
    }

    if (isValidUUID(id)) {
      try {
        deleteMemberAction(id).catch(() => {});
      } catch {}
    }
  };

  const changeRole = async (id: string, newRole: "super_admin" | "admin" | "member" | "volunteer") => {
    await updateMember(id, { role: newRole as any });
  };


  // ===================== DEPARTMENT MUTATIONS =====================
  const createDepartment = async (name: string, description: string, lead: string) => {
    const id = generateSafeUUID();
    const newDept: Department = {
      id,
      name,
      description,
      lead,
      memberCount: 0,
    };

    addDepartmentToState(newDept);

    try {
      const supabase = createClient();
      await (supabase.from("departments") as any).insert({
        id,
        name,
        description,
      });
    } catch (e) {
      console.warn("Department created in local state");
    }

    try {
      createDepartmentAction({ name, description, lead }).catch(() => {});
    } catch {}

    return newDept;
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    setDepartments((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
      setSyncedData(STORAGE_KEYS.DEPARTMENTS, updated);
      return updated;
    });
    if (isValidUUID(id)) {
      try {
        const supabase = createClient();
        await (supabase.from("departments") as any).update(updates).eq("id", id);
      } catch (e) {
        console.warn("Department updated in local state");
      }

      try {
        updateDepartmentAction(id, updates).catch(() => {});
      } catch {}
    }
  };

  const deleteDepartment = async (id: string) => {
    setDepartments((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      setSyncedData(STORAGE_KEYS.DEPARTMENTS, updated);
      return updated;
    });
    if (isValidUUID(id)) {
      try {
        const supabase = createClient();
        await (supabase.from("departments") as any).delete().eq("id", id);
      } catch (e) {
        console.warn("Department deleted in local state");
      }

      try {
        deleteDepartmentAction(id).catch(() => {});
      } catch {}
    }
  };

  // ===================== ANNOUNCEMENTS =====================
  const postAnnouncement = async (
    title: string,
    content: string,
    priority: "normal" | "urgent" = "normal",
    isEmergency: boolean = false
  ) => {
    const id = generateSafeUUID();
    const newNotice: Announcement = {
      id,
      title,
      content,
      priority,
      is_emergency: isEmergency,
      created_at: new Date().toISOString(),
    };

    addAnnouncementToState(newNotice);

    try {
      const supabase = createClient();
      await (supabase.from("announcements") as any).insert({
        id,
        title,
        content,
        priority,
        is_emergency: isEmergency,
      });
    } catch (e) {
      console.warn("Announcement created in local state");
    }

    try {
      postAnnouncementAction({ title, content, priority, is_emergency: isEmergency }).catch(() => {});
    } catch {}

    return newNotice;
  };

  const deleteAnnouncement = async (id: string) => {
    setAnnouncements((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      setSyncedData(STORAGE_KEYS.ANNOUNCEMENTS, updated);
      return updated;
    });
    if (isValidUUID(id)) {
      try {
        const supabase = createClient();
        await (supabase.from("announcements") as any).delete().eq("id", id);
      } catch (e) {
        console.warn("Announcement deleted in local state");
      }

      try {
        deleteAnnouncementAction(id).catch(() => {});
      } catch {}
    }
  };

  const toggleEmergencyBanner = async (id: string) => {
    setAnnouncements((prev) => {
      const updated = prev.map((a) =>
        a.id === id ? { ...a, is_emergency: !a.is_emergency } : a
      );
      setSyncedData(STORAGE_KEYS.ANNOUNCEMENTS, updated);
      return updated;
    });
  };

  // ===================== GALLERY MUTATIONS =====================
  const addGalleryMedia = async (
    title: string,
    mediaUrl: string,
    category: "general" | "previous_events" | "workshops" = "previous_events",
    mediaType: "image" | "video" = "image"
  ) => {
    const id = generateSafeUUID();
    const newMedia: GalleryMedia = {
      id,
      title,
      media_url: mediaUrl,
      category,
      media_type: mediaType,
      date: "2026",
      event_title: "Mirai Cultural Showcase",
      thumbnail_color: "from-cyan-600/30 via-blue-600/20 to-slate-950",
    };

    addGalleryMediaToState(newMedia);

    try {
      const supabase = createClient();
      await (supabase.from("gallery") as any).insert({
        id,
        title,
        media_url: mediaUrl,
        category,
        media_type: mediaType,
      });
    } catch (e) {
      console.warn("Gallery media created in local state");
    }

    try {
      uploadGalleryMediaAction({ title, media_url: mediaUrl, category, media_type: mediaType }).catch(() => {});
    } catch {}

    return newMedia;
  };

  const deleteGalleryMedia = async (id: string) => {
    setGallery((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      setSyncedData(STORAGE_KEYS.GALLERY, updated);
      return updated;
    });
    if (isValidUUID(id)) {
      try {
        const supabase = createClient();
        await (supabase.from("gallery") as any).delete().eq("id", id);
      } catch (e) {
        console.warn("Gallery media deleted in local state");
      }

      try {
        deleteGalleryMediaAction(id).catch(() => {});
      } catch {}
    }
  };

  // ===================== REGISTRATION EXPORT (NO ROLL NUMBER) =====================
  const exportRegistrationsCSV = (eventId?: string) => {
    const targetRegistrations =
      !eventId || eventId === "all"
        ? registrations
        : registrations.filter((r) => r.event_id === eventId);

    const headers = ["Pass ID", "Student Name", "Email", "Phone", "Event Title", "Department", "Registered At"];
    const rows = targetRegistrations.map((r) => [
      r.id,
      `"${r.student_name}"`,
      r.student_email,
      r.student_phone,
      `"${r.event_title}"`,
      `"${r.department || "General"}"`,
      new Date(r.registered_at).toLocaleString("en-IN"),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `malhar_registrations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteRegistration = (id: string) => {
    setRegistrations((prev) => {
      const target = prev.find((r) => r.id === id);
      const updated = prev.filter((r) => r.id !== id);
      setSyncedData(STORAGE_KEYS.REGISTRATIONS, updated);
      // Also decrement the event's registered_count
      if (target?.event_id || target?.event_title) {
        setEvents((evPrev) => {
          const evUpdated = evPrev.map((ev) =>
            ev.id === target.event_id ||
            (ev.title && target.event_title && ev.title.trim().toLowerCase() === target.event_title.trim().toLowerCase())
              ? { ...ev, registered_count: Math.max(0, (ev.registered_count || 0) - 1) }
              : ev
          );
          setSyncedData(STORAGE_KEYS.EVENTS, evUpdated);
          return evUpdated;
        });
      }
      return updated;
    });
  };

  // ===================== HERO BACKGROUND SLIDESHOW MUTATIONS =====================
  const addHeroSlide = async (slide: Omit<HeroSlide, "id" | "created_at">) => {
    const newSlide: HeroSlide = {
      ...slide,
      id: generateSafeUUID(),
      created_at: new Date().toISOString(),
    };

    // Write to Supabase hero_slides (cross-device sync via Realtime)
    try {
      const supabase = createClient();
      await (supabase.from("hero_slides") as any).insert({
        id: newSlide.id,
        image_url: newSlide.image_url,
        title: newSlide.title || "",
        subtitle: newSlide.caption || "",
        is_active: newSlide.is_active !== false,
        sort_order: newSlide.order || 0,
        created_at: newSlide.created_at,
      });
    } catch (e) {
      console.warn("[HeroSlide] Supabase insert failed, using local state:", e);
    }

    setHeroSlides((prev) => {
      if (prev.some((s) => s.id === newSlide.id || (s.image_url === newSlide.image_url && s.title === newSlide.title))) {
        return prev;
      }
      const updated = [...prev, newSlide];
      setSyncedData(STORAGE_KEYS.HERO_SLIDES, updated);
      return updated;
    });
    return newSlide;
  };

  const updateHeroSlide = (id: string, updates: Partial<HeroSlide>) => {
    // Write to Supabase
    try {
      const supabase = createClient();
      (supabase.from("hero_slides") as any).update({
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.caption !== undefined && { subtitle: updates.caption }),
        ...(updates.is_active !== undefined && { is_active: updates.is_active }),
        ...(updates.order !== undefined && { sort_order: updates.order }),
        ...(updates.image_url !== undefined && { image_url: updates.image_url }),
      }).eq("id", id).then(() => {});
    } catch {}

    setHeroSlides((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      setSyncedData(STORAGE_KEYS.HERO_SLIDES, updated);
      return updated;
    });
  };

  const toggleHeroSlideActive = (id: string) => {
    setHeroSlides((prev) => {
      const slide = prev.find((s) => s.id === id);
      const newActive = !slide?.is_active;

      // Write to Supabase
      try {
        const supabase = createClient();
        (supabase.from("hero_slides") as any).update({ is_active: newActive }).eq("id", id).then(() => {});
      } catch {}

      const updated = prev.map((s) => (s.id === id ? { ...s, is_active: newActive } : s));
      setSyncedData(STORAGE_KEYS.HERO_SLIDES, updated);
      return updated;
    });
  };

  const deleteHeroSlide = (id: string) => {
    // Delete from Supabase
    try {
      const supabase = createClient();
      (supabase.from("hero_slides") as any).delete().eq("id", id).then(() => {});
    } catch {}

    setHeroSlides((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      setSyncedData(STORAGE_KEYS.HERO_SLIDES, updated);
      return updated;
    });
  };

  const reorderHeroSlides = (newSlides: HeroSlide[]) => {
    const updated = newSlides.map((s, idx) => ({ ...s, order: idx + 1 }));

    // Batch update sort_order in Supabase
    try {
      const supabase = createClient();
      updated.forEach((s) => {
        (supabase.from("hero_slides") as any).update({ sort_order: s.order }).eq("id", s.id).then(() => {});
      });
    } catch {}

    setHeroSlides(updated);
    setSyncedData(STORAGE_KEYS.HERO_SLIDES, updated);
  };

  return {
    events,
    members,
    departments,
    announcements,
    gallery,
    stats,
    registrations,
    heroSlides,
    loading,
    // Adders & Stat Updaters
    updateStats,
    addMemberToState,
    addEventToState,
    addDepartmentToState,
    addAnnouncementToState,
    addGalleryMediaToState,
    // Direct Creators & Mutators
    createEvent,
    updateEvent,
    deleteEvent,
    registerStudentForEvent,
    createMember,
    updateMember,
    deleteMember,
    changeRole,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    postAnnouncement,
    deleteAnnouncement,
    toggleEmergencyBanner,
    addGalleryMedia,
    deleteGalleryMedia,
    exportRegistrationsCSV,
    deleteRegistration,
    // Hero Slides
    addHeroSlide,
    updateHeroSlide,
    toggleHeroSlideActive,
    deleteHeroSlide,
    reorderHeroSlides,
  };
}

