// Login rate limiting (anti brute-force). SERVER ONLY.
//
// Two layers, both fail-open (any error → no throttle, so the rate limiter can
// never lock a legitimate user out of their own vault):
//   1. In-process Map — instant, works the moment you deploy, scoped to one warm
//      serverless instance.
//   2. Supabase `login_throttle` table — durable, shared across instances and
//      restarts. Inactive until the migration in supabase/throttle.sql is run;
//      until then layer 1 still protects.
//
// Keyed by sha256(email|ip) so no raw email or IP is ever stored.

import crypto from 'node:crypto';
import { admin } from '@/lib/supabase-admin';

const MAX_FAILS = 8; // failures allowed within the window before a lockout
const WINDOW_MS = 15 * 60 * 1000; // rolling window for counting failures
const LOCK_MS = 15 * 60 * 1000; // how long a lockout lasts

export function throttleKey(email: string, ip: string): string {
  return crypto.createHash('sha256').update(`${email.toLowerCase()}|${ip}`).digest('hex');
}

// ── Layer 1: in-process fast path ──────────────────────────────────────────
type Mem = { fails: number; firstFail: number; lockedUntil: number };
const mem = new Map<string, Mem>();

// Pure helpers (take `now` so they're unit-testable).
export function memWait(key: string, now: number): number {
  const m = mem.get(key);
  if (m && m.lockedUntil > now) return Math.ceil((m.lockedUntil - now) / 1000);
  return 0;
}

export function memFail(key: string, now: number): number {
  const m = mem.get(key);
  let fails = 1;
  let firstFail = now;
  if (m && now - m.firstFail <= WINDOW_MS) {
    fails = m.fails + 1;
    firstFail = m.firstFail;
  }
  const lockedUntil = fails >= MAX_FAILS ? now + LOCK_MS : 0;
  mem.set(key, { fails, firstFail, lockedUntil });
  return lockedUntil > now ? Math.ceil((lockedUntil - now) / 1000) : 0;
}

export function memClear(key: string): void {
  mem.delete(key);
}

// ── Layer 2: durable Supabase store (fail-open) ─────────────────────────────
async function dbWait(key: string): Promise<number> {
  try {
    const { data } = await admin()
      .from('login_throttle')
      .select('locked_until')
      .eq('key', key)
      .maybeSingle();
    if (!data?.locked_until) return 0;
    const ms = new Date(data.locked_until).getTime() - Date.now();
    return ms > 0 ? Math.ceil(ms / 1000) : 0;
  } catch {
    return 0;
  }
}

async function dbFail(key: string): Promise<number> {
  try {
    const db = admin();
    const { data } = await db
      .from('login_throttle')
      .select('fails, first_fail')
      .eq('key', key)
      .maybeSingle();
    const now = Date.now();
    let fails = 1;
    let firstFail = now;
    if (data) {
      const windowStart = new Date(data.first_fail).getTime();
      if (now - windowStart <= WINDOW_MS) {
        fails = (data.fails as number) + 1;
        firstFail = windowStart;
      }
    }
    const locked = fails >= MAX_FAILS;
    await db.from('login_throttle').upsert({
      key,
      fails,
      first_fail: new Date(firstFail).toISOString(),
      locked_until: locked ? new Date(now + LOCK_MS).toISOString() : null,
      updated_at: new Date(now).toISOString(),
    });
    return locked ? Math.ceil(LOCK_MS / 1000) : 0;
  } catch {
    return 0;
  }
}

async function dbClear(key: string): Promise<void> {
  try {
    await admin().from('login_throttle').delete().eq('key', key);
  } catch {
    /* ignore */
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

// Seconds the caller must wait before trying again (0 = allowed).
export async function throttleStatus(key: string): Promise<number> {
  const m = memWait(key, Date.now());
  if (m > 0) return m;
  return dbWait(key);
}

// Record a failed login. Returns the lockout duration in seconds if this trips
// a lock, else 0.
export async function recordFail(key: string): Promise<number> {
  const m = memFail(key, Date.now());
  const d = await dbFail(key);
  return Math.max(m, d);
}

// Clear all failures for a key after a successful login.
export async function recordSuccess(key: string): Promise<void> {
  memClear(key);
  await dbClear(key);
}
