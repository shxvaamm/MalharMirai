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
import { HeroSlide } from "@/lib/mock-data";

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
      .filter((s: HeroSlide) => s.is_active);

    // Return whatever active slides exist — even an empty array is fine.
    // The client hook will handle loading defaults if truly nothing is in DB.
    return slides;
  } catch {
    // On any error (network, auth, etc.), return empty so client takes over.
    return [];
  }
}

