import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/supabase-admin';
import { signSession, SESSION_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Verifies email + authHash server-side, then sets a signed session cookie.
// The browser never talks to Supabase directly.
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

  const { data, error } = await authClient().auth.signInWithPassword({
    email,
    password: authHash,
  });
  if (error || !data.user) {
    return NextResponse.json({ error: 'Wrong email or master password' }, { status: 401 });
  }

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
