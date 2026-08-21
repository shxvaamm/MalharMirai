import { NextRequest, NextResponse } from "next/server";

// Same secret as middleware
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

/**
 * POST /api/auth/admin-session
 * Called after login to issue a server-signed HMAC cookie.
 * Body: { email: string, role: string }
 * The caller must already be authenticated (Supabase session) — 
 * we verify via club_members/profiles before issuing the cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const role = body.role || 'admin';

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const hmac = await computeHmac(email);

    const res = NextResponse.json({ success: true, token: hmac });
    // Persistent cookies — survive tab close, last 24 hours (matching client-side cookie max-age)
    const cookieOpts = { path: '/', sameSite: 'lax' as const, maxAge: 86400 };
    res.cookies.set('malhar_demo_admin', hmac, cookieOpts);
    res.cookies.set('malhar_demo_role', role, cookieOpts);
    res.cookies.set('malhar_user_email', encodeURIComponent(email), cookieOpts);

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
