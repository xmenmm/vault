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
  return b64(await pbkdf2(masterKey, enc.encode(masterPassword), 1));
}
const email = (process.env.NEW_EMAIL || '').trim().toLowerCase();
const pw = process.env.NEW_PASSWORD;
const authHash = await deriveAuthHash(email, pw);
const res = await fetch((process.env.APP_URL || 'https://vault-xi-beryl.vercel.app') + '/api/auth/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, authHash }),
});
console.log('login HTTP', res.status, '-', await res.text());
