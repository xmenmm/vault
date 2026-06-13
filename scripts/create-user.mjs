import { createClient } from '@supabase/supabase-js';

// Creates the single vault account by computing the SAME authHash the browser
// would (PBKDF2 600k → masterKey → PBKDF2 1 → authHash), so the user can log in
// by typing the email + master password printed below.
const enc = new TextEncoder();
const PBKDF2_ITERS = 600_000;
const b64 = (bytes) => Buffer.from(bytes).toString('base64');

async function pbkdf2(password, salt, iterations, bits = 256) {
  const key = await crypto.subtle.importKey('raw', password, 'PBKDF2', false, ['deriveBits']);
  const out = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, bits);
  return new Uint8Array(out);
}

async function deriveAuthHash(email, masterPassword) {
  const emailNorm = email.trim().toLowerCase();
  const masterKey = await pbkdf2(enc.encode(masterPassword), enc.encode(emailNorm), PBKDF2_ITERS);
  const authHashBytes = await pbkdf2(masterKey, enc.encode(masterPassword), 1);
  return b64(authHashBytes);
}

function genPassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const r = new Uint32Array(16);
  crypto.getRandomValues(r);
  let s = '';
  for (let i = 0; i < 16; i++) {
    s += chars[r[i] % chars.length];
    if ((i + 1) % 4 === 0 && i < 15) s += '-';
  }
  return s;
}

const email = (process.env.NEW_EMAIL || '').trim().toLowerCase();
const masterPassword = process.env.NEW_PASSWORD || genPassword();
if (!email) {
  console.log('set NEW_EMAIL');
  process.exit(1);
}

const authHash = await deriveAuthHash(email, masterPassword);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { error } = await admin.auth.admin.createUser({ email, password: authHash, email_confirm: true });
if (error) {
  console.log('ERR', error.message);
  process.exit(1);
}

console.log('=== ACCOUNT CREATED ===');
console.log('EMAIL          :', email);
console.log('MASTER PASSWORD:', masterPassword);
