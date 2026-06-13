import { createClient } from '@supabase/supabase-js';
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const target = process.env.DELETE_EMAIL;
if (!target) {
  console.log('set DELETE_EMAIL');
  process.exit(1);
}
const { data } = await admin.auth.admin.listUsers();
const u = (data?.users ?? []).find((x) => x.email === target);
if (u) {
  await admin.auth.admin.deleteUser(u.id); // cascades to vault_items
  console.log('deleted:', target, u.id);
} else {
  console.log('not found:', target);
}
