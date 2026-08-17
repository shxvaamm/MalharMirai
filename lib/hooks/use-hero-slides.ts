"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { HeroSlide, DEFAULT_HERO_SLIDES } from "@/lib/mock-data";
import {
  getSyncedData,
  setSyncedData,
  STORAGE_KEYS,
  subscribeSync,
} from "@/lib/store/sync-store";

async function fetchSlidesFromDB(): Promise<HeroSlide[] | null> {
  try {
    const supabase = createClient();
    const { data, error } = await (supabase.from("hero_slides") as any)
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data) return null;
    if (data.length === 0) return null;

    return data.map((d: any) => ({
      id: d.id,
      image_url: d.image_url,
      title: d.title || "",
      caption: d.subtitle || d.caption || "",
      order: d.sort_order ?? 0,
      is_active: d.is_active !== false,
      created_at: d.created_at,
    }));
  } catch {
    return null;
  }
}

async function seedDefaultSlidesToDB(): Promise<void> {
  try {
    const supabase = createClient();
    const rows = DEFAULT_HERO_SLIDES.map((s) => ({
      id: s.id,
      image_url: s.image_url,
      title: s.title || "",
      subtitle: s.caption || "",
      is_active: s.is_active,
      sort_order: s.order,
    }));
    // Use upsert so it never fails if rows exist
    await (supabase.from("hero_slides") as any).upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  } catch {
    // Non-critical — defaults will show from code
  }
}

export function useHeroSlides() {
  const [slides, setSlides] = React.useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let channel: any = null;

    // Show cached data immediately (same browser)
    const cached = getSyncedData<HeroSlide[]>(STORAGE_KEYS.HERO_SLIDES, DEFAULT_HERO_SLIDES);
    if (cached && cached.length > 0) setSlides(cached);

    async function loadAndSync() {
      if (cancelled) return;
      const dbSlides = await fetchSlidesFromDB();
      if (cancelled) return;

      if (dbSlides && dbSlides.length > 0) {
        setSlides(dbSlides);
        setSyncedData(STORAGE_KEYS.HERO_SLIDES, dbSlides);
      } else {
        // DB is empty — seed defaults so future fetches work
        await seedDefaultSlidesToDB();
        // Re-fetch after seeding
        const seeded = await fetchSlidesFromDB();
        if (!cancelled && seeded && seeded.length > 0) {
          setSlides(seeded);
          setSyncedData(STORAGE_KEYS.HERO_SLIDES, seeded);
        }
      }
    }

    loadAndSync();

    // Poll every 8 seconds as fallback if Realtime isn't working
    pollTimer = setInterval(() => {
      loadAndSync();
    }, 8000);

    // Supabase Realtime subscription
    try {
      const supabase = createClient();
      channel = supabase
        .channel("hero_slides_realtime_v2")
        .on("postgres_changes", { event: "*", schema: "public", table: "hero_slides" }, () => {
          loadAndSync();
        })
        .subscribe();
    } catch {}

    // Same-tab/window sync via BroadcastChannel (localStorage)
    const unsubscribe = subscribeSync<HeroSlide[]>(
      STORAGE_KEYS.HERO_SLIDES,
      DEFAULT_HERO_SLIDES,
      (updated) => {
        if (!cancelled) setSlides(updated);
      }
    );

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      unsubscribe();
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, []);

  const activeSlides = React.useMemo(() => {
    return slides
      .filter((s) => s.is_active)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [slides]);

  return {
    slides,
    activeSlides: activeSlides.length > 0 ? activeSlides : DEFAULT_HERO_SLIDES,
  };
}
