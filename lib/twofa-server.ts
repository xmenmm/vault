// Two-factor (TOTP + WhatsApp OTP) data layer. SERVER ONLY.
// One row per user: an optional TOTP secret, an optional verified WhatsApp
// number, a transient WhatsApp OTP, and hashed one-time recovery codes.

import crypto from 'node:crypto';
import { admin } from '@/lib/supabase-admin';
import { verifyTotp } from '@/lib/totp-server';

export type RecoveryEntry = { h: string; used: boolean };
export type TwoFaRow = {
  secret: string | null;
  recovery: RecoveryEntry[];
  wa_phone: string | null;
  wa_verified: boolean;
  wa_code_hash: string | null;
  wa_code_exp: string | null;
  wa_sent_at: string | null;
};

const UNDEFINED_TABLE = '42P01'; // Postgres: table not created yet → feature off
const OTP_TTL_MS = 5 * 60 * 1000;
const SEND_COOLDOWN_MS = 30 * 1000;
const COLS = 'secret, recovery, wa_phone, wa_verified, wa_code_hash, wa_code_exp, wa_sent_at';

// ── hashing ──
function normalizeRecovery(code: string): string {
  return (code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
export function hashRecovery(code: string): string {
  return crypto.createHash('sha256').update(normalizeRecovery(code)).digest('hex');
}
function hashOtp(code: string): string {
  return crypto.createHash('sha256').update((code ?? '').replace(/\D/g, '')).digest('hex');
}
function safeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ── read / shape ──
export async function getTwoFaRow(owner: string): Promise<TwoFaRow | null> {
  const { data, error } = await admin().from('user_2fa').select(COLS).eq('owner', owner).maybeSingle();
  if (error) {
    if (error.code === UNDEFINED_TABLE) return null;
    throw new Error(error.message);
  }
  if (!data) return null;
  return {
    secret: (data.secret as string) ?? null,
    recovery: (data.recovery as RecoveryEntry[]) ?? [],
    wa_phone: (data.wa_phone as string) ?? null,
    wa_verified: !!data.wa_verified,
    wa_code_hash: (data.wa_code_hash as string) ?? null,
    wa_code_exp: (data.wa_code_exp as string) ?? null,
    wa_sent_at: (data.wa_sent_at as string) ?? null,
  };
}

export function isEnabled(row: TwoFaRow | null): boolean {
  return !!row && (!!row.secret || (!!row.wa_phone && row.wa_verified));
}
export function twoFaMethods(row: TwoFaRow | null): { totp: boolean; whatsapp: boolean } {
  return { totp: !!row?.secret, whatsapp: !!row?.wa_phone && !!row?.wa_verified };
}

// ── recovery codes ──
export function makeRecoveryCodes(n = 8): { plain: string[]; hashed: RecoveryEntry[] } {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  const plain: string[] = [];
  for (let i = 0; i < n; i++) {
    const bytes = crypto.randomBytes(8);
    let s = '';
    for (let j = 0; j < 8; j++) s += alphabet[bytes[j] % alphabet.length];
    plain.push(`${s.slice(0, 4)}-${s.slice(4)}`);
  }
  return { plain, hashed: plain.map((c) => ({ h: hashRecovery(c), used: false })) };
}

// ── TOTP enrollment ──
export async function storeTotp(owner: string, secret: string, recovery: RecoveryEntry[]): Promise<void> {
  const { error } = await admin().from('user_2fa').upsert({ owner, secret, recovery });
  if (error) throw new Error(error.message);
}

// ── WhatsApp: OTP codes ──
export function makeOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

// Seconds left on the resend cooldown (0 = may send).
export function cooldownRemaining(row: TwoFaRow | null, now = Date.now()): number {
  if (!row?.wa_sent_at) return 0;
  const ms = SEND_COOLDOWN_MS - (now - new Date(row.wa_sent_at).getTime());
  return ms > 0 ? Math.ceil(ms / 1000) : 0;
}

// Enrollment: store the (unverified) phone + a fresh OTP to confirm it.
export async function setWaEnrollOtp(owner: string, phone: string, code: string): Promise<void> {
  const { error } = await admin().from('user_2fa').upsert({
    owner,
    wa_phone: phone,
    wa_verified: false,
    wa_code_hash: hashOtp(code),
    wa_code_exp: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    wa_sent_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

// Login-time: refresh the OTP for an already-verified phone.
export async function setWaLoginOtp(owner: string, code: string): Promise<void> {
  const { error } = await admin()
    .from('user_2fa')
    .update({
      wa_code_hash: hashOtp(code),
      wa_code_exp: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      wa_sent_at: new Date().toISOString(),
    })
    .eq('owner', owner);
  if (error) throw new Error(error.message);
}

// Confirm enrollment: verify the code, mark the phone verified, mint recovery
// codes if this is the user's first second factor.
export async function confirmWaEnroll(
  owner: string,
  row: TwoFaRow,
  code: string
): Promise<{ ok: boolean; recovery?: string[] }> {
  if (!row.wa_code_hash || !row.wa_code_exp) return { ok: false };
  if (new Date(row.wa_code_exp).getTime() < Date.now()) return { ok: false };
  if (!safeHexEqual(hashOtp(code), row.wa_code_hash)) return { ok: false };

  let recoveryPlain: string[] | undefined;
  let recovery = row.recovery;
  if (!recovery || recovery.length === 0) {
    const made = makeRecoveryCodes(8);
    recoveryPlain = made.plain;
    recovery = made.hashed;
  }
  const { error } = await admin()
    .from('user_2fa')
    .update({ wa_verified: true, wa_code_hash: null, wa_code_exp: null, recovery })
    .eq('owner', owner);
  if (error) throw new Error(error.message);
  return { ok: true, recovery: recoveryPlain };
}

export async function deleteTwoFa(owner: string): Promise<void> {
  const { error } = await admin().from('user_2fa').delete().eq('owner', owner);
  if (error) throw new Error(error.message);
}

// Verify a login code against TOTP, an active WhatsApp OTP, or a recovery code.
// Single-use factors (WhatsApp OTP, recovery) are consumed on a hit.
export async function checkTwoFaCode(owner: string, row: TwoFaRow, code: string): Promise<boolean> {
  const clean = (code ?? '').trim();
  if (!clean) return false;

  if (row.secret && verifyTotp(row.secret, clean)) return true;

  if (
    row.wa_verified &&
    row.wa_code_hash &&
    row.wa_code_exp &&
    new Date(row.wa_code_exp).getTime() >= Date.now() &&
    safeHexEqual(hashOtp(clean), row.wa_code_hash)
  ) {
    const { error } = await admin()
      .from('user_2fa')
      .update({ wa_code_hash: null, wa_code_exp: null })
      .eq('owner', owner);
    if (error) throw new Error(error.message);
    return true;
  }

  const h = hashRecovery(clean);
  const idx = row.recovery.findIndex((r) => !r.used && safeHexEqual(r.h, h));
  if (idx !== -1) {
    const next = row.recovery.map((r, i) => (i === idx ? { ...r, used: true } : r));
    const { error } = await admin().from('user_2fa').update({ recovery: next }).eq('owner', owner);
    if (error) throw new Error(error.message);
    return true;
  }
  return false;
}
