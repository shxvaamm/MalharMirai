import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function sanitizeUrl(url?: string): string {
  if (!url) return "https://lqaldejqwxtvbrqymkln.supabase.co";
  return url.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_X_DukL0UshA3UVCIKPTSDg_H4Z_L5Oz";

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },

      },
    }
  );

  return { supabase, response: supabaseResponse };
};
