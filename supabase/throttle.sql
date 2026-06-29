-- ============================================================
-- Vault — login rate limiting (anti brute-force)
-- Run in: Supabase dashboard → SQL Editor → New query
--
-- Optional but recommended. Until you run this, login throttling still works
-- per-instance (in-memory); this table makes it durable across instances and
-- restarts. Only the service-role server key ever touches it; no raw email or
-- IP is stored (the key is a sha256 hash).
-- ============================================================

create table if not exists public.login_throttle (
  key          text primary key,             -- sha256(email|ip)
  fails        int  not null default 0,
  first_fail   timestamptz not null default now(),
  locked_until timestamptz,
  updated_at   timestamptz not null default now()
);

-- Lock everyone out except the service role (which bypasses RLS).
alter table public.login_throttle enable row level security;
