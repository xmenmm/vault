import { NextRequest, NextResponse } from 'next/server';
import { currentUserId } from '@/lib/auth';
import { admin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// Download one attachment's ciphertext (+ encrypted meta) for the owner.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const owner = await currentUserId();
  if (!owner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await admin()
    .from('attachments')
    .select('data, meta, size')
    .eq('id', params.id)
    .eq('owner', owner)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(data);
}

// Delete one attachment (owner-scoped).
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const owner = await currentUserId();
  if (!owner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await admin().from('attachments').delete().eq('id', params.id).eq('owner', owner);
  if (error) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  return NextResponse.json({ ok: true });
}
