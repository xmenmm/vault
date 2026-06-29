-- ============================================================
-- Vault — encrypted attachments (files stored per item)
-- Run in: Supabase dashboard → SQL Editor → New query
--
-- Optional. Each file is encrypted in the browser (AES-256-GCM, same master
-- key) BEFORE upload; the server only ever stores ciphertext. Both the bytes
-- (`data`, base64) and the filename/type (`meta`) are encrypted. Deleting an
-- item removes its attachments (cascade). Only the service-role server key
-- touches this table. Keep files small (the app caps them) — they live in the
-- database, not object storage.
-- ============================================================

create table if not exists public.attachments (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references auth.users(id) on delete cascade,
  item_id    uuid not null references public.vault_items(id) on delete cascade,
  meta       text not null,                 -- encrypted JSON { name, type }
  data       text not null,                 -- encrypted file bytes (iv:ciphertext, base64)
  size       int  not null,                 -- original byte size (for display)
  created_at timestamptz not null default now()
);

create index if not exists attachments_owner_item_idx on public.attachments (owner, item_id);

alter table public.attachments enable row level security;
