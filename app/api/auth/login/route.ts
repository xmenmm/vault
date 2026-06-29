import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/supabase-admin';
import { signSession, SESSION_COOKIE } from '@/lib/session';
import { throttleKey, throttleStatus, recordFail, recordSuccess } from '@/lib/throttle';

export const dynamic = 'force-dynamic';

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

// Verifies email + authHash server-side, then sets a signed session cookie.
// The browser never talks to Supabase directly. Failed attempts are rate
// limited per (email + IP) to blunt brute-force / credential-stuffing.
export async function POST(req: NextRequest) {
  let body: { email?: string; authHash?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const { email, authHash } = body;
  if (!email || !authHash) {
    return NextResponse.json({ error: 'email and authHash required' }, { status: 400 });
  }

  const key = throttleKey(email, clientIp(req));

  // Already locked out? Refuse before even touching the auth backend.
  const wait = await throttleStatus(key);
  if (wait > 0) {
    return NextResponse.json(
      { error: 'too many attempts', retryAfter: wait },
      { status: 429, headers: { 'Retry-After': String(wait) } }
    );
  }

  const { data, error } = await authClient().auth.signInWithPassword({
    email,
    password: authHash,
  });
  if (error || !data.user) {
    const lockedFor = await recordFail(key);
    if (lockedFor > 0) {
      return NextResponse.json(
        { error: 'too many attempts', retryAfter: lockedFor },
        { status: 429, headers: { 'Retry-After': String(lockedFor) } }
      );
    }
    return NextResponse.json({ error: 'Wrong email or master password' }, { status: 401 });
  }

  await recordSuccess(key);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, signSession(data.user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
