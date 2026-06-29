import { NextResponse } from 'next/server';
import { currentUserId } from '@/lib/auth';
import { getTwoFa } from '@/lib/twofa-server';

export const dynamic = 'force-dynamic';

// Whether the signed-in user has 2FA enabled (for the Settings UI).
export async function GET() {
  const owner = await currentUserId();
  if (!owner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const tf = await getTwoFa(owner);
    return NextResponse.json({ enabled: !!tf });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
