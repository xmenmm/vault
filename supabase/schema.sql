-- ============================================================
-- Vault — Supabase schema
-- Run in: Supabase dashboard → SQL Editor → New query
--
-- The server NEVER sees plaintext. `data` holds AES-256-GCM ciphertext
-- encrypted in the browser with a key derived from the master password.
-- ============================================================

create table if not exists public.vault_items (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references auth.users(id) on delete cascade,
  data       text not null,                 -- "iv:ciphertext", AES-256-GCM, encrypted client-side
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vault_items_owner_idx
  on public.vault_items (owner, updated_at desc);

-- ── Row Level Security: a user can only touch their own rows ──
alter table public.vault_items enable row level security;

drop policy if exists "own select" on public.vault_items;
create policy "own select" on public.vault_items
  for select using (auth.uid() = owner);

drop policy if exists "own insert" on public.vault_items;
create policy "own insert" on public.vault_items
  for insert with check (auth.uid() = owner);

drop policy if exists "own update" on public.vault_items;
create policy "own update" on public.vault_items
  for update using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists "own delete" on public.vault_items;
create policy "own delete" on public.vault_items
  for delete using (auth.uid() = owner);

-- ── Login rate limiting (anti brute-force) ──
-- Keyed by sha256(email|ip); only the service-role server key touches it.
create table if not exists public.login_throttle (
  key          text primary key,
  fails        int  not null default 0,
  first_fail   timestamptz not null default now(),
  locked_until timestamptz,
  updated_at   timestamptz not null default now()
);
alter table public.login_throttle enable row level security;

-- ── Encrypted attachments (files stored per item, ciphertext only) ──
create table if not exists public.attachments (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references auth.users(id) on delete cascade,
  item_id    uuid not null references public.vault_items(id) on delete cascade,
  meta       text not null,
  data       text not null,
  size       int  not null,
  created_at timestamptz not null default now()
);
create index if not exists attachments_owner_item_idx on public.attachments (owner, item_id);
alter table public.attachments enable row level security;

-- ── Two-factor authentication (opt-in TOTP and/or WhatsApp OTP for login) ──
create table if not exists public.user_2fa (
  owner        uuid primary key references auth.users(id) on delete cascade,
  secret       text,                                  -- base32 TOTP secret (nullable)
  recovery     jsonb not null default '[]'::jsonb,
  wa_phone     text,                                  -- WhatsApp number, digits only
  wa_verified  boolean not null default false,
  wa_code_hash text,
  wa_code_exp  timestamptz,
  wa_sent_at   timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.user_2fa enable row level security;
