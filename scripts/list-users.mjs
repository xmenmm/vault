import { createClient } from '@supabase/supabase-js';
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data, error } = await admin.auth.admin.listUsers();
if (error) {
  console.log('ERR', error.message);
} else {
  console.log('user count:', data.users.length);
  for (const u of data.users) console.log('-', u.email, '(created', u.created_at + ')');
}
