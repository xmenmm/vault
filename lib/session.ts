import crypto from 'node:crypto';

// Tiny signed-cookie session: we trust the user id only if the HMAC matches.
const COOKIE = 'vault_session';

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not set');
  return s;
}

export function signSession(userId: string): string {
  const payload = Buffer.from(userId).toString('base64url');
  const mac = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${mac}`;
}

export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payload, mac] = token.split('.');
  if (!payload || !mac) return null;
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return Buffer.from(payload, 'base64url').toString('utf8');
}

export const SESSION_COOKIE = COOKIE;
