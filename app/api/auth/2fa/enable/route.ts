import { NextRequest, NextResponse } from 'next/server';
import { currentUserId } from '@/lib/auth';
import { verifyTotp } from '@/lib/totp-server';
import { makeRecoveryCodes, storeTwoFa } from '@/lib/twofa-server';

export const dynamic = 'force-dynamic';

// Turn on 2FA. The client generates the secret and shows its QR; this confirms
// the user can produce a valid code before we store the secret, then returns
// one-time recovery codes (shown once).
export async function POST(req: NextRequest) {
  const owner = await currentUserId();
  if (!owner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { secret?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const secret = (body.secret ?? '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  const code = (body.code ?? '').trim();
  if (secret.length < 16 || secret.length > 128) {
    return NextResponse.json({ error: 'bad secret' }, { status: 400 });
  }
  if (!verifyTotp(secret, code)) {
    return NextResponse.json({ error: 'invalid code' }, { status: 400 });
  }

  const { plain, hashed } = makeRecoveryCodes(8);
  try {
    await storeTwoFa(owner, secret, hashed);
  } catch {
    return NextResponse.json(
      { error: 'twofa storage unavailable — run supabase/twofa.sql' },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true, recovery: plain });
}
