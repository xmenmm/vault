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
