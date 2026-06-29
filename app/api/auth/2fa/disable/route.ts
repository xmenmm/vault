import { NextRequest, NextResponse } from 'next/server';
import { currentUserId } from '@/lib/auth';
import { getTwoFa, checkTwoFaCode, deleteTwoFa } from '@/lib/twofa-server';

export const dynamic = 'force-dynamic';

// Turn off 2FA. Requires a current TOTP (or recovery) code, so a hijacked
// session alone can't remove the second factor.
export async function POST(req: NextRequest) {
  const owner = await currentUserId();
  if (!owner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const code = (body.code ?? '').trim();

  let twofa;
  try {
    twofa = await getTwoFa(owner);
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (!twofa) return NextResponse.json({ ok: true }); // already off

  let accepted = false;
  try {
    accepted = await checkTwoFaCode(owner, twofa, code);
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (!accepted) return NextResponse.json({ error: 'invalid code' }, { status: 401 });

  try {
    await deleteTwoFa(owner);
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
