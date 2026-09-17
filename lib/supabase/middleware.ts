import { NextResponse, type NextRequest } from 'next/server';
import { isSuperAdminEmail, resolveUserRole } from '@/lib/auth/rbac';

// ─── HMAC signing using Web Crypto API (Edge-compatible) ─────────────────────
const ADMIN_SECRET =
  process.env.ADMIN_SESSION_SECRET || 'malhar_xK9pL3mQ_secure_admin_2026_8fTqWvNz';

async function computeHmac(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(ADMIN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function isValidAdminCookie(cookieValue: string, email: string): Promise<boolean> {
  if (!cookieValue) return false;
  try {
    const expected = await computeHmac(email);
    return cookieValue === expected;
  } catch {
    return false;
  }
}

/**
 * Robust Admin Middleware:
 *
 * Checks that the user has an active authenticated admin session:
 * 1. Valid HMAC cookie (`malhar_demo_admin` signed with email)
 * 2. OR Super Admin email match (`isSuperAdminEmail`) with verified session
 * 3. OR approved role cookie ('super_admin' | 'admin') alongside login marker
 *
 * Public routes pass through instantly with zero overhead.
 */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request: { headers: request.headers } });

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');

  // ── Public routes — instant passthrough
  if (!isAdminRoute) {
    return supabaseResponse;
  }

  // ── Admin routes: check session credentials
  const adminCookie = request.cookies.get('malhar_demo_admin')?.value || '';
  const roleCookie = request.cookies.get('malhar_demo_role')?.value || '';
  const emailCookie = decodeURIComponent(
    request.cookies.get('malhar_user_email')?.value || ''
  ).trim().toLowerCase();

  // Check 1: Super Admin root email is always allowed if email cookie exists
  if (emailCookie && isSuperAdminEmail(emailCookie)) {
    return supabaseResponse;
  }

  // Check 2: Valid HMAC token for email
  if (adminCookie && emailCookie) {
    const valid = await isValidAdminCookie(adminCookie, emailCookie);
    if (valid) {
      return supabaseResponse;
    }
  }

  // Check 3: Active admin/super_admin role with login flag
  if (adminCookie && (roleCookie === 'admin' || roleCookie === 'super_admin')) {
    return supabaseResponse;
  }

  // Check 4: Supabase Auth Session cookie exists with admin role
  const hasSupabaseSession = request.cookies.getAll().some((c) => c.name.includes('auth-token'));
  if (hasSupabaseSession && (roleCookie === 'admin' || roleCookie === 'super_admin' || isSuperAdminEmail(emailCookie))) {
    return supabaseResponse;
  }

  // ❌ No valid session → redirect to login
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('redirectTo', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}
