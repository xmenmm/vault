import { NextRequest, NextResponse } from 'next/server';
import { currentUserId } from '@/lib/auth';
import { getTwoFaRow, confirmWaEnroll } from '@/lib/twofa-server';

export const dynamic = 'force-dynamic';

// Finish WhatsApp enrollment: verify the test code, mark the number verified,
// and (if this is the first second factor) return one-time recovery codes.
export async function POST(req: NextRequest) {
  const owner = await currentUserId();
  if (!owner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  let row;
  try {
    row = await getTwoFaRow(owner);
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (!row || !row.wa_phone) {
    return NextResponse.json({ error: 'no pending enrollment' }, { status: 400 });
  }

  let result;
  try {
    result = await confirmWaEnroll(owner, row, (body.code ?? '').trim());
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (!result.ok) return NextResponse.json({ error: 'invalid code' }, { status: 400 });
  return NextResponse.json({ ok: true, recovery: result.recovery ?? null });
}
