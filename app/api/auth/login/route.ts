import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/supabase-admin';
import { signSession, SESSION_COOKIE, sessionCookieOptions, signPending2fa } from '@/lib/session';
import { throttleKey, throttleStatus, recordFail, recordSuccess, clientIp } from '@/lib/throttle';
import { getTwoFaRow, isEnabled } from '@/lib/twofa-server';

export const dynamic = 'force-dynamic';

// Verifies email + authHash server-side, then sets a signed session cookie.
// The browser never talks to Supabase directly. Failed attempts are rate
// limited per (email + IP) to blunt brute-force / credential-stuffing. If the
// account has 2FA enabled, a session is withheld until the second factor is
// verified at /api/auth/2fa/verify.
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

  // Password is correct. If this user has 2FA enabled, withhold the session and
  // ask for the second factor. Fail closed on a real lookup error (don't bypass
  // the gate); a missing table just means the feature is off.
  let row;
  try {
    row = await getTwoFaRow(data.user.id);
  } catch {
    return NextResponse.json({ error: 'auth temporarily unavailable' }, { status: 503 });
  }
  if (isEnabled(row)) {
    return NextResponse.json({
      need2fa: true,
      pending: signPending2fa(data.user.id),
      methods: { totp: !!row!.secret, whatsapp: !!row!.wa_phone && row!.wa_verified },
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, signSession(data.user.id), sessionCookieOptions());
  return res;
}
