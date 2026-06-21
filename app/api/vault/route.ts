import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { admin } from '@/lib/supabase-admin';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function owner(): Promise<string | null> {
  const c = await cookies();
  return verifySession(c.get(SESSION_COOKIE)?.value);
}

// List the signed-in user's encrypted items.
export async function GET() {
  const o = await owner();
  if (!o) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data, error } = await admin()
    .from('vault_items')
    .select('id,data,created_at,updated_at')
    .eq('owner', o)
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// Create a new encrypted item. Body: { data: "<ciphertext>" }
export async function POST(req: NextRequest) {
  const o = await owner();
  if (!o) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: payload } = await req.json().catch(() => ({}));
  if (typeof payload !== 'string') return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const { data, error } = await admin()
    .from('vault_items')
    .insert({ owner: o, data: payload })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

// Update an item. Body: { id, data: "<ciphertext>" }
export async function PATCH(req: NextRequest) {
  const o = await owner();
  if (!o) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id, data: payload } = await req.json().catch(() => ({}));
  if (!id || typeof payload !== 'string') return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const { error } = await admin()
    .from('vault_items')
    .update({ data: payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner', o);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Delete an item. Body: { id }
export async function DELETE(req: NextRequest) {
  const o = await owner();
  if (!o) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const { error } = await admin().from('vault_items').delete().eq('id', id).eq('owner', o);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
