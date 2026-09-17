/**
 * Server-side hero slides fetcher.
 * This module must NOT be imported by client components — it uses the server-only
 * Supabase client which depends on next/headers (cookies).
 *
 * Used exclusively by app/(public)/layout.tsx to fetch slide data at request time
 * so images are present in the initial HTML without a client-side fetch waterfall.
 *
 * Returns [] (empty) on any error — never DEFAULT_HERO_SLIDES.
 * An empty return means the component shows a plain dark container while the
 * client-side fetch resolves. This prevents any dummy/stock image flash.
 */
import { createClient } from "@/lib/supabase/server";
import { HeroSlide, DEFAULT_HERO_SLIDES } from "@/lib/mock-data";

export async function fetchHeroSlidesServer(): Promise<HeroSlide[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.from("hero_slides") as any)
      .select("id, image_url, title, subtitle, caption, sort_order, is_active, created_at")
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      // Return empty — never fall back to DEFAULT_HERO_SLIDES here.
      // A dummy image flash is worse than a momentary dark background.
      return [];
    }

    // Disallow the rogue stock/dummy slide uploaded to Supabase
    const DISALLOWED_SLIDE_IDS = new Set(["51041736-2077-4a8b-8957-bbd79d63b298"]);

    const slides: HeroSlide[] = data
      .map((d: any) => ({
        id: d.id,
        image_url: d.image_url,
        title: d.title || "",
        caption: d.subtitle || d.caption || "",
        order: d.sort_order ?? 0,
        is_active: d.is_active !== false,
        created_at: d.created_at,
      }))
      .filter((s: HeroSlide) => 
        s.is_active && 
        !DISALLOWED_SLIDE_IDS.has(s.id) &&
        !s.image_url.includes("1789245928283_slide.jpg")
      );

    // If active slides exist, return them. If empty, fall back to verified MALHAR slides
    return slides.length > 0 ? slides : DEFAULT_HERO_SLIDES;
  } catch {
    // On any error (network, auth, etc.), return empty so client takes over.
    return [];
  }
}

