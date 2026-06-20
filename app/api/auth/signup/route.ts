import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Creates the auth user (email + authHash as password), no email confirmation.
// authHash is already a one-way derivation of the master password — the server
// never receives the master password itself.
export async function POST(req: NextRequest) {
  let body: { email?: string; authHash?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const { email, authHash } = body;
  if (!email || !authHash) {
    return NextResponse.json({ error: 'email and authHash required' }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Single-user mode: once the only account exists, registration is closed.
  // The SDK returns { data: null, error } on network failure (it doesn't throw),
  // so if we can't verify there are zero users we must NOT create one — fail
  // closed, otherwise an unreachable backend would let the gate be bypassed.
  const { data: existing, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  if (listErr || !existing) {
    return NextResponse.json({ error: 'Service unavailable, try again' }, { status: 503 });
  }
  if (existing.users.length > 0) {
    return NextResponse.json({ error: 'Registration is closed' }, { status: 403 });
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password: authHash,
    email_confirm: true,
  });

  if (error && !/already|registered|exists/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Whether newly created or already existing, the client will now sign in.
  return NextResponse.json({ ok: true });
}
