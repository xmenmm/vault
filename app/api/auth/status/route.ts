import { NextResponse } from 'next/server';
import { admin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// Single-user mode: registration is only open until the first (only) account
// exists. After that, setup=false → the UI shows Unlock only.
export async function GET() {
  try {
    const { data } = await admin().auth.admin.listUsers({ page: 1, perPage: 1 });
    const hasUser = (data?.users?.length ?? 0) > 0;
    return NextResponse.json({ setup: !hasUser });
  } catch {
    // on error, default to closed (don't expose signup)
    return NextResponse.json({ setup: false });
  }
}
