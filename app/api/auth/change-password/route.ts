import { NextRequest, NextResponse } from 'next/server';
import { admin, authClient } from '@/lib/supabase-admin';
import { currentUserId } from '@/lib/auth';
import { throttleKey, throttleStatus, recordFail, recordSuccess, clientIp } from '@/lib/throttle';

export const dynamic = 'force-dynamic';

type Row = { id: string; data: string };

// Rotate the master password. The client has already re-encrypted every item
// with the NEW key (the server never sees plaintext or either key). Here we:
//   1. verify the OLD authHash (so a hijacked session alone can't rotate),
//   2. write all re-encrypted items in ONE atomic upsert,
//   3. change the Supabase login password to the new authHash.
// Step 2 before 3 so we never end up with a new password but old-key data.
export async function POST(req: NextRequest) {
  const owner = await currentUserId();
  if (!owner) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { oldAuthHash?: string; newAuthHash?: string; items?: Row[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const { oldAuthHash, newAuthHash, items } = body;
  if (!oldAuthHash || !newAuthHash || !Array.isArray(items)) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  if (items.some((i) => typeof i?.id !== 'string' || typeof i?.data !== 'string')) {
    return NextResponse.json({ error: 'bad items' }, { status: 400 });
  }

  // Throttle wrong-old-password attempts on this endpoint.
  const key = throttleKey(`chpw:${owner}`, clientIp(req));
  const wait = await throttleStatus(key);
  if (wait > 0) {
    return NextResponse.json({ error: 'too many attempts', retryAfter: wait }, { status: 429, headers: { 'Retry-After': String(wait) } });
  }

  // Resolve the account email (the PBKDF2 salt / Supabase identifier).
  const { data: userRes, error: userErr } = await admin().auth.admin.getUserById(owner);
  const email = userRes?.user?.email;
  if (userErr || !email) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  // 1. Verify the OLD master password.
  const { data: signin, error: signErr } = await authClient().auth.signInWithPassword({
    email,
    password: oldAuthHash,
  });
  if (signErr || !signin.user) {
    const lockedFor = await recordFail(key);
    return NextResponse.json(
      lockedFor > 0 ? { error: 'too many attempts', retryAfter: lockedFor } : { error: 'wrong password' },
      { status: lockedFor > 0 ? 429 : 401 }
    );
  }
  await recordSuccess(key);

  // Guard: the payload must cover EXACTLY the user's current items, so nothing is
  // left encrypted under the old key.
  const { data: existing, error: listErr } = await admin()
    .from('vault_items')
    .select('id')
    .eq('owner', owner);
  if (listErr) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  const have = new Set((existing ?? []).map((r) => r.id as string));
  const got = new Set(items.map((i) => i.id));
  if (have.size !== got.size || [...have].some((id) => !got.has(id))) {
    return NextResponse.json({ error: 'out of sync — reload and retry' }, { status: 409 });
  }

  // 2. Atomic re-encrypt write (single upsert statement).
  if (items.length > 0) {
    const now = new Date().toISOString();
    const rows = items.map((i) => ({ id: i.id, owner, data: i.data, updated_at: now }));
    const { error: upErr } = await admin().from('vault_items').upsert(rows);
    if (upErr) return NextResponse.json({ error: 'write failed' }, { status: 503 });
  }

  // 3. Rotate the Supabase login password to the new authHash.
  const { error: pwErr } = await admin().auth.admin.updateUserById(owner, { password: newAuthHash });
  if (pwErr) {
    // Items are re-encrypted but the password didn't change. The client keeps the
    // old keys; retrying re-runs the (idempotent) upsert + this step.
    return NextResponse.json({ error: 'password update failed — retry' }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
