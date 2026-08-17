import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';

function sanitizeUrl(url?: string): string {
  if (!url) return 'https://lqaldejqwxtvbrqymkln.supabase.co';
  return url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

/**
 * Creates a typed Supabase client for Client Components (runs in the browser).
 * Correctly initialized with NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
 */
export function createClient() {
  const supabaseUrl = sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_X_DukL0UshA3UVCIKPTSDg_H4Z_L5Oz';

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}


