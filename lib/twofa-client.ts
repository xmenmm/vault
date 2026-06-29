// Client helpers for 2FA enrollment. The secret is generated on-device and only
// leaves the browser (to be stored server-side) once the user confirms a code.

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// A random base32 TOTP secret (default 160-bit → 32 chars).
export function randomBase32Secret(bytes = 20): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of buf) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

// otpauth:// URI an authenticator app can import (by QR or by tap on mobile).
export function otpauthUri(secret: string, account: string, issuer = 'myVault'): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
