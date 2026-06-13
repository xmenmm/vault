import { createClient } from '@supabase/supabase-js';
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data } = await admin.auth.admin.listUsers();
const u = (data?.users ?? []).find((x) => x.email === 'probe-connectivity@example.com');
if (u) {
  await admin.auth.admin.deleteUser(u.id); // cascades to vault_items
  console.log('deleted probe user + its data:', u.id);
} else {
  console.log('no probe user found');
}
