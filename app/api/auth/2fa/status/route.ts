import { NextResponse } from 'next/server';
import { currentUserId } from '@/lib/auth';
import { getTwoFaRow, twoFaMethods } from '@/lib/twofa-server';
import { whatsappConfigured, maskPhone } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

// 2FA state for the Settings UI: which methods are on, plus whether the server
// is configured to send WhatsApp at all.
export async function GET() {
  const owner = await currentUserId();
  if (!owner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const row = await getTwoFaRow(owner);
    const methods = twoFaMethods(row);
    return NextResponse.json({
      enabled: methods.totp || methods.whatsapp,
      methods,
      waPhoneMasked: methods.whatsapp && row?.wa_phone ? maskPhone(row.wa_phone) : null,
      waAvailable: whatsappConfigured(),
    });
  } catch {
    return NextResponse.json({ enabled: false, methods: { totp: false, whatsapp: false }, waAvailable: whatsappConfigured() });
  }
}
