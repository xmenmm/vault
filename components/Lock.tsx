'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { deriveKeys, type Keys } from '@/lib/crypto';
import { SplineScene } from '@/components/ui/splite';

export default function Lock({ onUnlock }: { onUnlock: (k: Keys) => void }) {
  const [setup, setSetup] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((d) => setSetup(!!d.setup))
      .catch(() => setSetup(false));
  }, []);

  const creating = setup === true;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) {
      setErr('Master password minimal 8 karakter');
      return;
    }
    if (creating && pw !== pw2) {
      setErr('Master password nggak cocok');
      return;
    }
    setBusy(true);
    try {
      const keys = await deriveKeys(email, pw);
      const cleanEmail = email.trim().toLowerCase();
      if (creating) {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, authHash: keys.authHash }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Gagal membuat brankas');
        }
      }
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, authHash: keys.authHash }),
      });
      if (!loginRes.ok) {
        const d = await loginRes.json().catch(() => ({}));
        throw new Error(d.error || 'Email atau master password salah');
      }
      onUnlock(keys);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal');
    } finally {
      setBusy(false);
    }
  }

  const label = 'block text-xs uppercase tracking-wide text-neutral-400 mb-1.5';
  const field =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#5b8cff] transition';

  return (
    <div className="min-h-screen w-full grid md:grid-cols-2 bg-[#05070c] text-white">
      {/* ── Panel brand / 3D kiri ── */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden border-r border-white/5 bg-gradient-to-br from-[#0b1020] to-[#05070c] p-10">
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-[#5b8cff]/20 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#7c5cff]/15 blur-[120px]" />

        <Link href="/" className="relative z-10 font-extrabold text-lg tracking-tight w-fit">
          🔐 my<span className="text-[#5b8cff]">Vault</span>
        </Link>

        <div className="relative z-0 flex-1 min-h-[300px] -my-2">
          <SplineScene
            scene="/robot.splinecode"
            className="!absolute inset-0 h-full w-full scale-110"
          />
        </div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Terenkripsi di perangkat kamu.</h2>
          <p className="mt-2 text-neutral-400 text-sm max-w-sm">
            Master password kamu satu-satunya kunci. Server nggak nyimpen apa pun
            selain ciphertext — bahkan kami nggak bisa baca brankas kamu.
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-neutral-300 max-w-sm">
            {['AES-256-GCM', 'Zero-knowledge', 'Jalan di HP', 'Privat'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="text-[#2bb079]">✓</span> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Panel form kanan ── */}
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="pointer-events-none absolute top-1/3 right-0 h-72 w-72 rounded-full bg-[#5b8cff]/10 blur-[120px] md:hidden" />
        <div className="relative w-full max-w-sm">
          <Link href="/" className="md:hidden mb-8 inline-block font-extrabold text-lg">
            🔐 my<span className="text-[#5b8cff]">Vault</span>
          </Link>

          {setup === null ? (
            <p className="text-neutral-400 text-sm">Memuat…</p>
          ) : (
            <>
              <h1 className="text-2xl font-bold">
                {creating ? 'Siapkan brankas kamu' : 'Selamat datang kembali'}
              </h1>
              <p className="mt-1.5 text-neutral-400 text-sm">
                {creating
                  ? 'Buat master password untuk brankas kamu.'
                  : 'Masukkan email dan master password untuk membuka.'}
              </p>

              {creating && (
                <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-200/80 leading-relaxed">
                  ⚠️ Master password kamu mengenkripsi semuanya dan nggak pernah dikirim
                  ke server. Lupa = data hilang permanen — nggak ada reset.
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
                    placeholder="kamu@email.com"
                  />
                </div>

                <div>
                  <label className={label}>Master password</label>
                  <input
                    className={field}
                    type="password"
                    autoComplete={creating ? 'new-password' : 'current-password'}
                    required
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                {creating && (
                  <div>
                    <label className={label}>Konfirmasi master password</label>
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
                  {busy ? 'Memproses…' : creating ? 'Buat brankas' : 'Buka'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
