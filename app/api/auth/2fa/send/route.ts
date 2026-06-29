import { NextRequest, NextResponse } from 'next/server';
import { verifyPending2fa } from '@/lib/session';
import { getTwoFaRow, cooldownRemaining, makeOtp, setWaLoginOtp } from '@/lib/twofa-server';
import { whatsappConfigured, sendWhatsAppOtp, maskPhone } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

// Login-time: send a fresh WhatsApp OTP to the enrolled number. Identified by the
// short-lived pending token from /api/auth/login (so the password already passed).
export async function POST(req: NextRequest) {
  let body: { pending?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const userId = verifyPending2fa(body.pending);
  if (!userId) return NextResponse.json({ error: 'session expired — sign in again' }, { status: 401 });
  if (!whatsappConfigured()) {
    return NextResponse.json({ error: 'whatsapp not configured' }, { status: 503 });
  }

  let row;
  try {
    row = await getTwoFaRow(userId);
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (!row || !row.wa_phone || !row.wa_verified) {
    return NextResponse.json({ error: 'whatsapp not enrolled' }, { status: 400 });
  }
  const cd = cooldownRemaining(row);
  if (cd > 0) return NextResponse.json({ error: 'cooldown', retryAfter: cd }, { status: 429 });

  const code = makeOtp();
  try {
    await setWaLoginOtp(userId, code);
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  const sent = await sendWhatsAppOtp(row.wa_phone, code);
  if (!sent.ok) return NextResponse.json({ error: 'send failed' }, { status: 502 });
  return NextResponse.json({ ok: true, to: maskPhone(row.wa_phone) });
}
