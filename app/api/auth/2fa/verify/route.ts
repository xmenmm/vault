import { NextRequest, NextResponse } from 'next/server';
import { signSession, SESSION_COOKIE, sessionCookieOptions, verifyPending2fa } from '@/lib/session';
import { throttleKey, throttleStatus, recordFail, recordSuccess, clientIp } from '@/lib/throttle';
import { getTwoFa, checkTwoFaCode } from '@/lib/twofa-server';

export const dynamic = 'force-dynamic';

// Second step of a 2FA login: exchange the short-lived pending token + a TOTP
// (or recovery) code for a real session. Throttled per (user + IP) so the
// 6-digit code can't be brute-forced.
export async function POST(req: NextRequest) {
  let body: { pending?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const userId = verifyPending2fa(body.pending);
  if (!userId) {
    return NextResponse.json({ error: 'session expired — sign in again' }, { status: 401 });
  }
  const code = (body.code ?? '').trim();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const key = throttleKey(`2fa:${userId}`, clientIp(req));
  const wait = await throttleStatus(key);
  if (wait > 0) {
    return NextResponse.json(
      { error: 'too many attempts', retryAfter: wait },
      { status: 429, headers: { 'Retry-After': String(wait) } }
    );
  }

  let twofa;
  try {
    twofa = await getTwoFa(userId);
  } catch {
    return NextResponse.json({ error: 'auth temporarily unavailable' }, { status: 503 });
  }

  // 2FA was disabled between the two steps — the password already passed, so
  // just grant the session.
  if (!twofa) {
    await recordSuccess(key);
    const ok = NextResponse.json({ ok: true });
    ok.cookies.set(SESSION_COOKIE, signSession(userId), sessionCookieOptions());
    return ok;
  }

  let accepted = false;
  try {
    accepted = await checkTwoFaCode(userId, twofa, code);
  } catch {
    return NextResponse.json({ error: 'auth temporarily unavailable' }, { status: 503 });
  }
  if (!accepted) {
    const lockedFor = await recordFail(key);
    if (lockedFor > 0) {
      return NextResponse.json(
        { error: 'too many attempts', retryAfter: lockedFor },
        { status: 429, headers: { 'Retry-After': String(lockedFor) } }
      );
    }
    return NextResponse.json({ error: 'invalid code' }, { status: 401 });
  }

  await recordSuccess(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, signSession(userId), sessionCookieOptions());
  return res;
}
