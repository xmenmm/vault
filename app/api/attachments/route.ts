import { NextRequest, NextResponse } from 'next/server';
import { currentUserId } from '@/lib/auth';
import { admin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const UNDEFINED_TABLE = '42P01';
const MAX_DATA_CHARS = 6_000_000; // ~4.4MB of base64 ciphertext (Vercel body cap is 4.5MB)
const MAX_SIZE = 3_000_000; // original file bytes

// List a single item's attachments (metadata only — no blobs).
export async function GET(req: NextRequest) {
  const owner = await currentUserId();
  if (!owner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const itemId = req.nextUrl.searchParams.get('item');
  if (!itemId) return NextResponse.json({ error: 'item required' }, { status: 400 });

  const { data, error } = await admin()
    .from('attachments')
    .select('id, meta, size, created_at')
    .eq('owner', owner)
    .eq('item_id', itemId)
    .order('created_at', { ascending: true });
  if (error) {
    if (error.code === UNDEFINED_TABLE) return NextResponse.json({ attachments: [], unavailable: true });
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  return NextResponse.json({ attachments: data ?? [] });
}

// Add an encrypted attachment to an item the user owns.
export async function POST(req: NextRequest) {
  const owner = await currentUserId();
  if (!owner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { itemId?: string; meta?: string; data?: string; size?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const { itemId, meta, data, size } = body;
  if (!itemId || typeof meta !== 'string' || typeof data !== 'string' || typeof size !== 'number') {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  if (data.length > MAX_DATA_CHARS || size > MAX_SIZE || size < 0) {
    return NextResponse.json({ error: 'too large' }, { status: 413 });
  }

  // The item must belong to the caller.
  const { data: owned, error: ownErr } = await admin()
    .from('vault_items')
    .select('id')
    .eq('id', itemId)
    .eq('owner', owner)
    .maybeSingle();
  if (ownErr) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  if (!owned) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: inserted, error } = await admin()
    .from('attachments')
    .insert({ owner, item_id: itemId, meta, data, size })
    .select('id, meta, size, created_at')
    .single();
  if (error) {
    if (error.code === UNDEFINED_TABLE) {
      return NextResponse.json({ error: 'attachments storage unavailable — run supabase/attachments.sql' }, { status: 503 });
    }
    return NextResponse.json({ error: 'write failed' }, { status: 503 });
  }
  return NextResponse.json({ attachment: inserted });
}
