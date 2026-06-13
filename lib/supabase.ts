import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Browser client (SPA). Session persists in localStorage; all vault reads/writes
// go straight from the browser under Row Level Security.
let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: true, autoRefreshToken: true } }
    );
  }
  return client;
}
