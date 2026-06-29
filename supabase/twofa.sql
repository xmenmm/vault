-- ============================================================
-- Vault — two-factor authentication (TOTP + WhatsApp OTP) for vault login
-- Run in: Supabase dashboard → SQL Editor → New query
--
-- Optional. One row per user holding the second-factor config: a TOTP secret
-- and/or a verified WhatsApp number, plus hashed one-time recovery codes. Only
-- the service-role server key touches this table. 2FA is opt-in; until a user
-- enables it (and until this table exists) login is unchanged.
--
-- The second factor gates the ability to obtain a session — it does NOT protect
-- the vault contents, which stay AES-encrypted with your master password.
-- ============================================================

create table if not exists public.user_2fa (
  owner        uuid primary key references auth.users(id) on delete cascade,
  secret       text,                                  -- base32 TOTP secret (nullable)
  recovery     jsonb not null default '[]'::jsonb,    -- [{ h: sha256hex, used: bool }]
  wa_phone     text,                                  -- WhatsApp number, digits only (E.164 without +)
  wa_verified  boolean not null default false,        -- phone confirmed via a test code
  wa_code_hash text,                                  -- pending WhatsApp OTP (sha256)
  wa_code_exp  timestamptz,                           -- WhatsApp OTP expiry
  wa_sent_at   timestamptz,                           -- last WhatsApp send (cooldown)
  created_at   timestamptz not null default now()
);

-- If you ran an earlier version of this file, bring the table up to date:
alter table public.user_2fa alter column secret drop not null;
alter table public.user_2fa add column if not exists wa_phone     text;
alter table public.user_2fa add column if not exists wa_verified  boolean not null default false;
alter table public.user_2fa add column if not exists wa_code_hash text;
alter table public.user_2fa add column if not exists wa_code_exp  timestamptz;
alter table public.user_2fa add column if not exists wa_sent_at   timestamptz;

alter table public.user_2fa enable row level security;
