import { createBrowserClient } from "@supabase/ssr";

function sanitizeUrl(url?: string): string {
  if (!url) return "https://lqaldejqwxtvbrqymkln.supabase.co";
  return url.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

export const createClient = () => {
  const supabaseUrl = sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_X_DukL0UshA3UVCIKPTSDg_H4Z_L5Oz";

  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};

