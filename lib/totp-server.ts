// Server-side TOTP verification (RFC 6238). SERVER ONLY.
// Uses node:crypto HMAC-SHA1 and checks a small window to tolerate clock skew.

import crypto from 'node:crypto';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input: string): Buffer {
  const clean = input.replace(/[\s=-]/g, '').toUpperCase();
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(secret: Buffer, counter: number, digits: number): string {
  const msg = Buffer.alloc(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const h = crypto.createHmac('sha1', secret).update(msg).digest();
  const offset = h[h.length - 1] & 0x0f;
  const bin =
    ((h[offset] & 0x7f) << 24) |
    (h[offset + 1] << 16) |
    (h[offset + 2] << 8) |
    h[offset + 3];
  return (bin % 10 ** digits).toString().padStart(digits, '0');
}

// Constant-time compare of two equal-purpose strings.
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Verify a user-entered code against the secret. `window` steps are checked on
// each side of the current 30s window to allow for clock drift / boundary typing.
export function verifyTotp(
  secret: string,
  code: string,
  opts: { period?: number; digits?: number; window?: number; now?: number } = {}
): boolean {
  const period = opts.period ?? 30;
  const digits = opts.digits ?? 6;
  const window = opts.window ?? 1;
  const now = opts.now ?? Date.now();

  const clean = (code ?? '').replace(/\D/g, '');
  if (clean.length !== digits) return false;
  const key = base32Decode(secret);
  if (key.length === 0) return false;

  const counter = Math.floor(now / 1000 / period);
  for (let w = -window; w <= window; w++) {
    if (safeEqual(hotp(key, counter + w, digits), clean)) return true;
  }
  return false;
}
