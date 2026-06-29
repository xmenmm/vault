// Zero-knowledge crypto — runs in the BROWSER only.
// The master password never leaves the device. From it we derive:
//   masterKey = PBKDF2-SHA256(masterPassword, email, 600k)
//   encKey    = HKDF(masterKey, "vault-enc")      → AES-256-GCM, encrypts data
//   authHash  = PBKDF2(masterKey, masterPassword, 1) → sent to Supabase as the
//               login password (one-way; server can't recover the master password)

const PBKDF2_ITERS = 600_000;
const enc = new TextEncoder();
const dec = new TextDecoder();

// TS 5.7+ types Uint8Array as generic over ArrayBufferLike, which the WebCrypto
// BufferSource overloads reject. Our bytes are always plain-ArrayBuffer-backed,
// so coerce explicitly.
const buf = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

function b64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromB64(str: string): Uint8Array {
  const s = atob(str);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function pbkdf2(
  password: Uint8Array,
  salt: Uint8Array,
  iterations: number,
  bits = 256
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', buf(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const out = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: buf(salt), iterations, hash: 'SHA-256' },
    key,
    bits
  );
  return new Uint8Array(out);
}

export type Keys = { encKey: CryptoKey; authHash: string };

// Derive the encryption key (kept in memory) + the auth hash (sent to Supabase).
export async function deriveKeys(email: string, masterPassword: string): Promise<Keys> {
  const emailNorm = email.trim().toLowerCase();

  const masterKey = await pbkdf2(
    enc.encode(masterPassword),
    enc.encode(emailNorm),
    PBKDF2_ITERS
  );

  // authHash — a one-way value derived from the master key. Safe to send.
  const authHashBytes = await pbkdf2(masterKey, enc.encode(masterPassword), 1);
  const authHash = b64(authHashBytes);

  // encKey — HKDF-expanded from the master key, used for AES-GCM.
  const hkdf = await crypto.subtle.importKey('raw', buf(masterKey), 'HKDF', false, [
    'deriveBits',
  ]);
  const encBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: buf(new Uint8Array(0)), info: buf(enc.encode('vault-enc')) },
    hkdf,
    256
  );
  const encKey = await crypto.subtle.importKey('raw', encBits, { name: 'AES-GCM' }, true, [
    'encrypt',
    'decrypt',
  ]);

  return { encKey, authHash };
}

// Export / restore the encryption key so a session can survive a page refresh
// without re-deriving from the master password.
export async function exportEncKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return b64(new Uint8Array(raw));
}

export async function importEncKey(b64str: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', buf(fromB64(b64str)), { name: 'AES-GCM' }, true, [
    'encrypt',
    'decrypt',
  ]);
}

// Encrypt a UTF-8 string → "iv:ciphertext" (both base64).
export async function encryptStr(encKey: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: buf(iv) },
    encKey,
    buf(enc.encode(plaintext))
  );
  return b64(iv) + ':' + b64(new Uint8Array(ct));
}

// Decrypt "iv:ciphertext" → UTF-8 string. Throws if the key is wrong / tampered.
export async function decryptStr(encKey: CryptoKey, payload: string): Promise<string> {
  const [ivB, ctB] = payload.split(':');
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: buf(fromB64(ivB)) },
    encKey,
    buf(fromB64(ctB))
  );
  return dec.decode(pt);
}

// Encrypt raw bytes (e.g. a file) → "iv:ciphertext" (both base64). Encrypting the
// bytes directly avoids the double-base64 blow-up of stringifying first.
export async function encryptBytes(encKey: CryptoKey, bytes: Uint8Array): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: buf(iv) }, encKey, buf(bytes));
  return b64(iv) + ':' + b64(new Uint8Array(ct));
}

// Decrypt "iv:ciphertext" → raw bytes. Throws if the key is wrong / tampered.
export async function decryptBytes(encKey: CryptoKey, payload: string): Promise<Uint8Array> {
  const [ivB, ctB] = payload.split(':');
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: buf(fromB64(ivB)) },
    encKey,
    buf(fromB64(ctB))
  );
  return new Uint8Array(pt);
}
