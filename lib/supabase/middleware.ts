import { NextResponse, type NextRequest } from 'next/server';

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
  if (!cookieValue || cookieValue === 'true' || cookieValue.length < 32) return false;
  try {
    const expected = await computeHmac(email);
    return cookieValue === expected;
  } catch {
    return false;
  }
}

/**
 * STRICT admin middleware:
 *
 * Admin access is ONLY granted when the user has gone through the login form
 * and received a server-signed HMAC cookie. Supabase persistent browser
 * sessions are intentionally NOT trusted — even if Chrome has a saved session,
 * the user must explicitly sign in via the login page.
 *
 * Public routes bypass all checks instantly.
 */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request: { headers: request.headers } });

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');

  // ── Public routes — instant passthrough, no checks
  if (!isAdminRoute) {
    return supabaseResponse;
  }

  // ── Admin routes: ONLY trust the HMAC-signed cookie set by the login form
  const adminCookie = request.cookies.get('malhar_demo_admin')?.value || '';
  const emailCookie = decodeURIComponent(
    request.cookies.get('malhar_user_email')?.value || ''
  );

  if (adminCookie && emailCookie) {
    const valid = await isValidAdminCookie(adminCookie, emailCookie);
    if (valid) {
      // ✅ Valid signed session — allow access
      return supabaseResponse;
    }
  }

  // ❌ No valid login-form session → redirect to login, NO exceptions
  // (Supabase auto-session is intentionally ignored here)
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('redirectTo', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}
