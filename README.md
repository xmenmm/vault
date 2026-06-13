# Vault — zero-knowledge password manager

One dashboard to store all your logins (Facebook, Gmail, anything), encrypted in
the browser. Built for Supabase + Vercel, usable from desktop and phone.

## Security model

- Your **master password never leaves the device.** In the browser it derives:
  - `masterKey = PBKDF2-SHA256(masterPassword, email, 600,000 iterations)`
  - `encKey = HKDF(masterKey)` → AES-256-GCM, encrypts every entry
  - `authHash = PBKDF2(masterKey, masterPassword, 1)` → the only thing sent to
    Supabase (as the login password). One-way: the server can't recover your
    master password from it.
- Supabase stores **ciphertext only** (`iv:ciphertext`). Row Level Security keeps
  each user's rows private. The encryption key exists only in memory and is wiped
  on lock / refresh / 10-minute idle.
- **There is no password reset.** Lose the master password → the data is gone.
  That's the point of zero-knowledge.

## 1. Fresh Supabase project

> Use a NEW project. Don't reuse keys that were ever shared anywhere.

1. https://supabase.com → New project.
2. **SQL Editor → New query** → paste `supabase/schema.sql` → Run.
3. **Project Settings → API → tab "Legacy anon, service_role API keys"** → copy
   the `anon` and `service_role` JWT keys, plus the Project URL.

## 2. Configure

```bash
cd D:\Users\user14\vault
npm install
copy .env.example .env.local   # PowerShell: cp .env.example .env.local
```

Fill `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy anon)
- `SUPABASE_SERVICE_ROLE_KEY` (legacy service_role — server only)

## 3. Run locally

```bash
npm run dev
```

Open http://localhost:5318 → **Create vault** (email + master password) → add logins.

## 4. Deploy (for phone access)

1. Push to a Git repo → import into **Vercel**.
2. Add the 3 env vars in Vercel → Project → Settings → Environment Variables.
3. Deploy. Open the Vercel URL on your phone, **Unlock** with the same email +
   master password — your entries decrypt on the device.

No redirect URLs or extra config needed; auth + data are pure Supabase.

## Notes

- Email confirmation is skipped (signup creates the user server-side via the
  service role). The email is only an identifier + the PBKDF2 salt.
- Clipboard is auto-cleared 30s after a copy.
