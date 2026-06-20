import { NextResponse } from 'next/server';
import { admin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// Single-user mode: registration is only open until the first (only) account
// exists. After that, setup=false → the UI shows Unlock only.
export async function GET() {
  try {
    const { data, error } = await admin().auth.admin.listUsers({ page: 1, perPage: 1 });
    // The Supabase SDK returns { data: null, error } on network failure instead
    // of throwing — so we must inspect `error`, not just rely on catch. If we
    // can't confirm the user count, fail CLOSED (hide signup) rather than
    // wrongly showing "create vault" when the backend is just unreachable.
    if (error || !data) return NextResponse.json({ setup: false });
    const hasUser = data.users.length > 0;
    return NextResponse.json({ setup: !hasUser });
  } catch {
    // on error, default to closed (don't expose signup)
    return NextResponse.json({ setup: false });
  }
}
