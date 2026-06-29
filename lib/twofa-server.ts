// Two-factor (TOTP) data layer. SERVER ONLY.
// Stores one secret per user plus hashed one-time recovery codes.

import crypto from 'node:crypto';
import { admin } from '@/lib/supabase-admin';
import { verifyTotp } from '@/lib/totp-server';

export type RecoveryEntry = { h: string; used: boolean };
export type TwoFa = { secret: string; recovery: RecoveryEntry[] };

// Postgres "undefined_table" — thrown when the migration hasn't been run yet.
const UNDEFINED_TABLE = '42P01';

export function hashRecovery(code: string): string {
  return crypto.createHash('sha256').update(normalizeRecovery(code)).digest('hex');
}

function normalizeRecovery(code: string): string {
  return (code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Read a user's 2FA config. Returns null when 2FA isn't set up OR the table
// doesn't exist yet (feature simply off). Throws on any *other* DB error so the
// caller can fail closed instead of silently bypassing the second factor.
export async function getTwoFa(owner: string): Promise<TwoFa | null> {
  const { data, error } = await admin()
    .from('user_2fa')
    .select('secret, recovery')
    .eq('owner', owner)
    .maybeSingle();
  if (error) {
    if (error.code === UNDEFINED_TABLE) return null;
    throw new Error(error.message);
  }
  if (!data?.secret) return null;
  return { secret: data.secret as string, recovery: (data.recovery as RecoveryEntry[]) ?? [] };
}

// Generate N human-friendly recovery codes (e.g. "K7Qd-9F2x"). Returns the
// plaintext (to show once) and the hashed entries (to store).
export function makeRecoveryCodes(n = 8): { plain: string[]; hashed: RecoveryEntry[] } {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  const plain: string[] = [];
  for (let i = 0; i < n; i++) {
    const bytes = crypto.randomBytes(8);
    let s = '';
    for (let j = 0; j < 8; j++) s += alphabet[bytes[j] % alphabet.length];
    plain.push(`${s.slice(0, 4)}-${s.slice(4)}`);
  }
  const hashed = plain.map((c) => ({ h: hashRecovery(c), used: false }));
  return { plain, hashed };
}

// Enable 2FA: store the secret + hashed recovery codes (upsert, so re-enrolling
// replaces the old secret).
export async function storeTwoFa(owner: string, secret: string, recovery: RecoveryEntry[]): Promise<void> {
  const { error } = await admin()
    .from('user_2fa')
    .upsert({ owner, secret, recovery, created_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function deleteTwoFa(owner: string): Promise<void> {
  const { error } = await admin().from('user_2fa').delete().eq('owner', owner);
  if (error) throw new Error(error.message);
}

// Check a submitted code against the TOTP secret OR an unused recovery code.
// On a recovery-code hit, that code is marked used (single-use). Returns whether
// the code was accepted.
export async function checkTwoFaCode(owner: string, tf: TwoFa, code: string): Promise<boolean> {
  if (verifyTotp(tf.secret, code)) return true;

  const h = hashRecovery(code);
  const idx = tf.recovery.findIndex((r) => !r.used && safeHexEqual(r.h, h));
  if (idx === -1) return false;

  const next = tf.recovery.map((r, i) => (i === idx ? { ...r, used: true } : r));
  const { error } = await admin().from('user_2fa').update({ recovery: next }).eq('owner', owner);
  if (error) throw new Error(error.message);
  return true;
}

function safeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
