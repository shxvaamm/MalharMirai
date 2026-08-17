import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// In-memory cache — avoids repeat Supabase calls within the same server process
let cache: { data: any[]; ts: number } | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

function createServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
  return createClient(url, key);
}

export async function GET(_req: NextRequest) {
  try {
    // Serve from in-memory cache if still fresh
    const now = Date.now();
    if (cache && now - cache.ts < CACHE_TTL_MS) {
      return NextResponse.json(
        { data: cache.data },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
            "X-Cache": "HIT",
          },
        }
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await (supabase.from("gallery") as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ data: [], error: error.message }, { status: 200 });
    }

    // Update cache
    cache = { data: data || [], ts: now };

    return NextResponse.json(
      { data: data || [] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          "X-Cache": "MISS",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ data: [], error: err.message }, { status: 200 });
  }
}
