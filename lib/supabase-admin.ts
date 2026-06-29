import { createClient } from '@supabase/supabase-js';

// SERVER ONLY. Service-role client — bypasses RLS; every query is scoped by the
// owner id we recover from the signed session cookie.
export function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// Anon client used only to verify credentials (signInWithPassword) on the server.
export function authClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// True when an error means "this table hasn't been created yet". The raw
// Postgres code is 42P01, but PostgREST (the supabase-js REST layer) reports a
// missing table from its schema cache as PGRST205/PGRST106 instead — so optional
// features (2FA, attachments) degrade to "off" cleanly until their migration runs.
export function isMissingTable(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = error.code || '';
  if (code === '42P01' || code === 'PGRST205' || code === 'PGRST204' || code === 'PGRST106') return true;
  const msg = (error.message || '').toLowerCase();
  return msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('could not find the table');
}
