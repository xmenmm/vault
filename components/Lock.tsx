'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deriveKeys, type Keys } from '@/lib/crypto';
import Hero3D from '@/components/Hero3D';

export default function Lock({ onUnlock }: { onUnlock: (k: Keys) => void }) {
  const [mode, setMode] = useState<'unlock' | 'create'>('unlock');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) {
      setErr('Master password must be at least 8 characters');
      return;
    }
    if (mode === 'create' && pw !== pw2) {
      setErr('Master passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const keys = await deriveKeys(email, pw);
      const cleanEmail = email.trim().toLowerCase();
      if (mode === 'create') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, authHash: keys.authHash }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Could not create vault');
        }
      }
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, authHash: keys.authHash }),
      });
      if (!loginRes.ok) {
        const d = await loginRes.json().catch(() => ({}));
        throw new Error(d.error || 'Wrong email or master password');
      }
      onUnlock(keys);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  const label = 'block text-xs uppercase tracking-wide text-neutral-400 mb-1.5';
  const field =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#5b8cff] transition';

  return (
    <div className="min-h-screen w-full grid md:grid-cols-2 bg-[#05070c] text-white">
      {/* ── Left brand / 3D panel ── */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden border-r border-white/5 bg-gradient-to-br from-[#0b1020] to-[#05070c] p-10">
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-[#5b8cff]/20 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#7c5cff]/15 blur-[120px]" />

        <Link href="/" className="relative z-10 font-extrabold text-lg tracking-tight w-fit">
          🔐 my<span className="text-[#5b8cff]">Vault</span>
        </Link>

        <div className="relative z-0 h-64 -my-4">
          <Hero3D className="!absolute inset-0 h-full w-full" />
        </div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Encrypted on your device.</h2>
          <p className="mt-2 text-neutral-400 text-sm max-w-sm">
            Your master password is the only key. The server stores nothing but
            ciphertext — not even we can read your vault.
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-neutral-300 max-w-sm">
            {['AES-256-GCM', 'Zero-knowledge', 'Works on phone', 'No tracking'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="text-[#2bb079]">✓</span> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="pointer-events-none absolute top-1/3 right-0 h-72 w-72 rounded-full bg-[#5b8cff]/10 blur-[120px] md:hidden" />
        <div className="relative w-full max-w-sm">
          <Link href="/" className="md:hidden mb-8 inline-block font-extrabold text-lg">
            🔐 my<span className="text-[#5b8cff]">Vault</span>
          </Link>

          <h1 className="text-2xl font-bold">
            {mode === 'create' ? 'Create your vault' : 'Welcome back'}
          </h1>
          <p className="mt-1.5 text-neutral-400 text-sm">
            {mode === 'create'
              ? 'Set a master password only you know.'
              : 'Enter your email and master password to unlock.'}
          </p>

          {mode === 'create' && (
            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-200/80 leading-relaxed">
              ⚠️ Your master password encrypts everything and is never sent to the
              server. Lose it and the data is gone — there is no reset.
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className={label}>Email</label>
              <input
                className={field}
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </div>

            <div>
              <label className={label}>Master password</label>
              <input
                className={field}
                type="password"
                autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {mode === 'create' && (
              <div>
                <label className={label}>Confirm master password</label>
                <input
                  className={field}
                  type="password"
                  autoComplete="new-password"
                  required
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}

            {err && <p className="text-sm text-[#e0503c]">{err}</p>}

            <button
              className="w-full rounded-xl bg-[#5b8cff] py-3 font-semibold text-white hover:bg-[#3f6fe0] transition disabled:opacity-60"
              disabled={busy}
            >
              {busy ? 'Working…' : mode === 'create' ? 'Create vault' : 'Unlock'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-400">
            {mode === 'unlock' ? (
              <>
                No vault yet?{' '}
                <button
                  className="font-semibold text-[#7aa2ff] hover:text-[#9db4ff]"
                  onClick={() => {
                    setMode('create');
                    setErr(null);
                  }}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have a vault?{' '}
                <button
                  className="font-semibold text-[#7aa2ff] hover:text-[#9db4ff]"
                  onClick={() => {
                    setMode('unlock');
                    setErr(null);
                  }}
                >
                  Unlock
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
