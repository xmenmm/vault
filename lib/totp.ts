// TOTP (RFC 6238) — runs in the browser. Shows rotating 2FA codes for an
// item that has an authenticator secret. Standard: SHA-1, 6 digits, 30s.

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input: string): Uint8Array {
  const clean = input.replace(/[\s=-]/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) continue; // skip non-base32 chars
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

// Seconds left in the current 30s window.
export function totpRemaining(period = 30, now = Date.now()): number {
  return period - (Math.floor(now / 1000) % period);
}

// Returns the current code, or '' if the secret is empty/invalid.
export async function totpCode(
  secret: string,
  opts: { period?: number; digits?: number; now?: number } = {}
): Promise<string> {
  const period = opts.period ?? 30;
  const digits = opts.digits ?? 6;
  const now = opts.now ?? Date.now();
  const key = base32Decode(secret);
  if (key.length === 0) return '';

  // 8-byte big-endian counter (modulo math — safe for large counters).
  let counter = Math.floor(now / 1000 / period);
  const msg = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    msg[i] = counter % 256;
    counter = Math.floor(counter / 256);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, msg as unknown as BufferSource));

  const offset = sig[sig.length - 1] & 0x0f;
  const bin =
    ((sig[offset] & 0x7f) << 24) |
    (sig[offset + 1] << 16) |
    (sig[offset + 2] << 8) |
    sig[offset + 3];
  return (bin % 10 ** digits).toString().padStart(digits, '0');
}
