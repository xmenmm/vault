import { NextRequest, NextResponse } from 'next/server';
import { currentUserId } from '@/lib/auth';
import { getTwoFaRow, cooldownRemaining, makeOtp, setWaEnrollOtp } from '@/lib/twofa-server';
import { whatsappConfigured, normalizePhone, sendWhatsAppOtp } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

// Begin WhatsApp 2FA enrollment: store the (unverified) number + send a test OTP.
export async function POST(req: NextRequest) {
  const owner = await currentUserId();
  if (!owner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!whatsappConfigured()) {
    return NextResponse.json({ error: 'whatsapp not configured' }, { status: 503 });
  }

  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const phone = normalizePhone(body.phone ?? '');
  if (phone.length < 8 || phone.length > 15) {
    return NextResponse.json({ error: 'bad phone' }, { status: 400 });
  }

  let row;
  try {
    row = await getTwoFaRow(owner);
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  const cd = cooldownRemaining(row);
  if (cd > 0) {
    return NextResponse.json({ error: 'cooldown', retryAfter: cd }, { status: 429 });
  }

  const code = makeOtp();
  try {
    await setWaEnrollOtp(owner, phone, code);
  } catch {
    return NextResponse.json(
      { error: 'twofa storage unavailable — run supabase/twofa.sql' },
      { status: 503 }
    );
  }
  const sent = await sendWhatsAppOtp(phone, code);
  if (!sent.ok) {
    return NextResponse.json({ error: 'send failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
