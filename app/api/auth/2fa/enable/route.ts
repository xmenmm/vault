import { NextRequest, NextResponse } from 'next/server';
import { currentUserId } from '@/lib/auth';
import { verifyTotp } from '@/lib/totp-server';
import { getTwoFaRow, makeRecoveryCodes, storeTotp } from '@/lib/twofa-server';

export const dynamic = 'force-dynamic';

// Turn on TOTP 2FA. The client generates the secret and shows its QR; this
// confirms the user can produce a valid code before we store the secret. If the
// user has no recovery codes yet, returns a fresh set (shown once).
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

  try {
    const row = await getTwoFaRow(owner);
    let recovery = row?.recovery ?? [];
    let plain: string[] | undefined;
    if (recovery.length === 0) {
      const made = makeRecoveryCodes(8);
      recovery = made.hashed;
      plain = made.plain;
    }
    await storeTotp(owner, secret, recovery);
    return NextResponse.json({ ok: true, recovery: plain ?? null });
  } catch {
    return NextResponse.json(
      { error: 'twofa storage unavailable — run supabase/twofa.sql' },
      { status: 503 }
    );
  }
}
