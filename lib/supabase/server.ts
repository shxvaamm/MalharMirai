import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/database';

function sanitizeUrl(url?: string): string {
  if (!url) return 'https://lqaldejqwxtvbrqymkln.supabase.co';
  return url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

/**
 * Creates a typed Supabase client for Server Components, Server Actions, and Route Handlers.
 * Automatically synchronizes authentication session cookies with Next.js headers.
 */
export async function createClient() {
  const cookieStore = cookies();
  const supabaseUrl = sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_X_DukL0UshA3UVCIKPTSDg_H4Z_L5Oz';

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Server Component context
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Server Component context
          }
        },
      },
    }
  );
}

/**
 * Creates a privileged administrative Supabase client using the SUPABASE_SERVICE_ROLE_KEY.
 * Use only on secure server-side routes (e.g. backend jobs, webhooks, auth overrides).
 */
export function createAdminClient() {
  const supabaseUrl = sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  return createSupabaseClient<Database>(
    supabaseUrl,
    serviceRoleKey || 'placeholder_service_role_key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
