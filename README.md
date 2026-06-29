# myVault — zero-knowledge password manager

One dashboard to store all your logins (Facebook, Gmail, anything), encrypted in
the browser. Built for Supabase + Vercel, usable from desktop and phone.

## Features

- **Item types** — logins, credit cards, secure notes, identities.
- **Built-in 2FA / TOTP** (RFC 6238) — rotating codes per entry.
- **Breach check** — HaveIBeenPwned via k-anonymity (only a 5-char hash prefix
  leaves the device).
- **Two-factor login (2FA)** — opt-in TOTP (Google Authenticator, Authy…) with
  one-time recovery codes. Server-enforced, so a stolen master password alone
  can't open the vault. Brute-force-throttled.
- **Biometric unlock** — WebAuthn + PRF; the master password always still works.
- **Generator** — random passwords or memorable passphrases, with an entropy /
  time-to-crack estimate.
- **CSV import / export** (Chrome, Bitwarden, etc.) + encrypted JSON backup.
- **PWA** — installable, works offline.
- **Bilingual** (Indonesian / English), light/dark themes, custom accent.
- **Power-user UX** — command palette (⌘K), keyboard navigation, undo on delete,
  bulk select, password history.

A full write-up of the encryption design lives at **`/security`**, and a
security contact is published at **`/.well-known/security.txt`** (RFC 9116).

## Security model

- Your **master password never leaves the device.** In the browser it derives:
  - `masterKey = PBKDF2-SHA256(masterPassword, email, 600,000 iterations)`
  - `encKey = HKDF(masterKey)` → AES-256-GCM, encrypts every entry
  - `authHash = PBKDF2(masterKey, masterPassword, 1)` → the only thing sent to
    Supabase (as the login password). One-way: the server can't recover your
    master password from it.
- Supabase stores **ciphertext only** (`iv:ciphertext`). Row Level Security keeps
  each user's rows private.
- **Session caching (trade-off, read this):** to avoid re-entering the master
  password on every refresh, the derived encryption key is cached in the browser
  `localStorage` (key `vault-k`). It is removed on **Lock**, after **30 minutes
  idle**, and **expires after 7 days** — whichever comes first. Consequence: while
  that cache is alive, anyone with access to the device (or via XSS) can open the
  vault **without** the master password. The master password itself is still never
  stored or sent. If you want strictly memory-only (re-login every refresh),
  remove the persistence in `app/providers.tsx`.
- **Login rate limiting.** Failed logins are throttled per (email + IP) — 8 misses
  in 15 minutes triggers a 15-minute lockout — to blunt online brute-force. It runs
  in-memory out of the box; run `supabase/throttle.sql` to make it durable across
  serverless instances. It fails **open** (a throttle-store outage never locks you
  out of your own vault).
- **Two-factor authentication (opt-in).** Enable TOTP in Settings → Security. The
  secret is generated on-device, shown as a QR, and only stored server-side once
  you confirm a code; the server then *withholds the session* on every login until
  a valid TOTP (or one-time recovery code) is supplied. It guards access to the
  ciphertext — the second factor is not part of the encryption key. Run
  `supabase/twofa.sql` to create the table; until then 2FA is simply unavailable.
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

## License

[MIT](LICENSE) — © 2026 myVault. Audit it, run it, ship it.
