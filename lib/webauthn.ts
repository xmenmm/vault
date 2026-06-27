// Biometric unlock via WebAuthn + the PRF extension.
//
// A platform passkey (Face / fingerprint) deterministically produces a 32-byte
// secret (PRF) from a fixed salt. We use that secret as an AES-GCM key to wrap
// the data needed to reopen the vault — the encryption key, the auth hash, and
// the email — and store only the *wrapped* blob. The PRF secret itself is never
// stored and can only be reproduced by the authenticator after a successful
// biometric check, so reading localStorage alone reveals nothing usable.
//
// This is strictly additive: the master password always still works. If PRF is
// unsupported or anything fails, we just don't offer (or fall back from) it —
// the user is never locked out.

import { exportEncKey, type Keys } from '@/lib/crypto';

const BIO = 'vault-bio';
const PRF_SALT = new TextEncoder().encode('myvault-prf-v1');
const td = new TextDecoder();

const asBuf = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

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

export type BioPayload = { encKeyB64: string; authHash: string; email: string };
type Stored = { credentialId: string; salt: string; iv: string; ct: string };

// Is a platform authenticator (Face/fingerprint) present at all?
export async function biometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function biometricEnabled(): boolean {
  try {
    return !!localStorage.getItem(BIO);
  } catch {
    return false;
  }
}

export function disableBiometric(): void {
  try {
    localStorage.removeItem(BIO);
  } catch {
    /* ignore */
  }
}

async function wrapKeyFromPrf(prf: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', prf, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

// Run a get() assertion and pull the PRF output for our salt.
async function derivePrf(credentialId: Uint8Array): Promise<ArrayBuffer> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: asBuf(challenge),
      allowCredentials: [{ type: 'public-key', id: asBuf(credentialId) }],
      userVerification: 'required',
      timeout: 60000,
      extensions: { prf: { eval: { first: asBuf(PRF_SALT) } } } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prf = (assertion?.getClientExtensionResults() as any)?.prf?.results?.first as ArrayBuffer | undefined;
  if (!prf) throw new Error('PRF tidak tersedia');
  return prf;
}

// Enable: create a platform passkey, derive its PRF secret, and store the
// wrapped payload. Throws (without storing anything) if PRF is unsupported.
export async function enableBiometric(keys: Keys, email: string): Promise<void> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: asBuf(challenge),
      rp: { name: 'myVault', id: location.hostname },
      user: { id: asBuf(userId), name: email, displayName: 'myVault' },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
        authenticatorAttachment: 'platform',
      },
      timeout: 60000,
      extensions: { prf: { eval: { first: asBuf(PRF_SALT) } } } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error('Pendaftaran biometrik dibatalkan');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ext = cred.getClientExtensionResults() as any;
  if (!ext?.prf || ext.prf.enabled === false) {
    throw new Error('Browser/perangkat ini belum mendukung kunci biometrik (PRF).');
  }

  const credentialId = new Uint8Array(cred.rawId);
  // Some browsers return the PRF output on create; otherwise do a get().
  const prf: ArrayBuffer = ext.prf.results?.first ?? (await derivePrf(credentialId));

  const wrap = await wrapKeyFromPrf(prf);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload: BioPayload = { encKeyB64: await exportEncKey(keys.encKey), authHash: keys.authHash, email };
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: asBuf(iv) },
    wrap,
    asBuf(new TextEncoder().encode(JSON.stringify(payload)))
  );

  const stored: Stored = {
    credentialId: b64(credentialId),
    salt: b64(PRF_SALT),
    iv: b64(iv),
    ct: b64(new Uint8Array(ct)),
  };
  localStorage.setItem(BIO, JSON.stringify(stored));
}

// Unlock: biometric prompt → PRF → unwrap → the payload needed to reopen.
export async function unlockWithBiometric(): Promise<BioPayload> {
  const raw = localStorage.getItem(BIO);
  if (!raw) throw new Error('Biometrik belum diaktifkan');
  const stored = JSON.parse(raw) as Stored;
  const prf = await derivePrf(fromB64(stored.credentialId));
  const wrap = await wrapKeyFromPrf(prf);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: asBuf(fromB64(stored.iv)) },
    wrap,
    asBuf(fromB64(stored.ct))
  );
  return JSON.parse(td.decode(pt)) as BioPayload;
}
