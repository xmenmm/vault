-- ============================================================
-- Vault — two-factor authentication (TOTP) for vault login
-- Run in: Supabase dashboard → SQL Editor → New query
--
-- Optional. Stores one TOTP secret per user plus hashed one-time recovery
-- codes. Only the service-role server key touches this table. 2FA is opt-in;
-- until a user enables it (and until this table exists) login is unchanged.
--
-- Note: the TOTP secret is a *second factor* — it does not protect the vault
-- contents (those stay AES-encrypted with your master password). It gates the
-- ability to obtain a session, so a stolen master password alone can't log in.
-- ============================================================

create table if not exists public.user_2fa (
  owner      uuid primary key references auth.users(id) on delete cascade,
  secret     text not null,                         -- base32 TOTP secret
  recovery   jsonb not null default '[]'::jsonb,    -- [{ h: sha256hex, used: bool }]
  created_at timestamptz not null default now()
);

alter table public.user_2fa enable row level security;
