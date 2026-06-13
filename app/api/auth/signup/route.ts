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
