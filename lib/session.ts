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
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

// ── Short-lived "password passed, awaiting 2FA" token ───────────────────────
// Issued after the master password verifies; exchanged (with a valid TOTP /
// recovery code) for a real session. Carries the user id + an issued-at stamp,
// HMAC-signed, and expires quickly so it can't be replayed later.
const PENDING_TTL_MS = 5 * 60 * 1000;

export function signPending2fa(userId: string): string {
  const payload = Buffer.from(`${userId}.${Date.now()}`).toString('base64url');
  const mac = crypto.createHmac('sha256', secret()).update(`2fa.${payload}`).digest('base64url');
  return `${payload}.${mac}`;
}

export function verifyPending2fa(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payload, mac] = token.split('.');
  if (!payload || !mac) return null;
  const expected = crypto.createHmac('sha256', secret()).update(`2fa.${payload}`).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const [userId, tsStr] = Buffer.from(payload, 'base64url').toString('utf8').split('.');
  const ts = Number(tsStr);
  if (!userId || !Number.isFinite(ts) || Date.now() - ts > PENDING_TTL_MS) return null;
  return userId;
}
