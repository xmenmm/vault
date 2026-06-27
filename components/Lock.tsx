'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { deriveKeys, importEncKey, type Keys } from '@/lib/crypto';
import { VaultPreview } from '@/components/VaultPreview';
import { biometricEnabled, unlockWithBiometric } from '@/lib/webauthn';
import { useLang } from '@/lib/i18n';

export default function Lock({ onUnlock }: { onUnlock: (k: Keys) => void }) {
  const [lang, setLang] = useLang();
  const t = L[lang];
  const [setup, setSetup] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [bioOn, setBioOn] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((d) => setSetup(!!d.setup))
      .catch(() => setSetup(false));
    setBioOn(biometricEnabled());
  }, []);

  const creating = setup === true;

  async function bioUnlock() {
    setErr(null);
    setBioBusy(true);
    try {
      const { encKeyB64, authHash, email } = await unlockWithBiometric();
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, authHash }),
      });
      if (!loginRes.ok) throw new Error(t.errExpired);
      const encKey = await importEncKey(encKeyB64);
      onUnlock({ encKey, authHash });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t.errBio);
    } finally {
      setBioBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pw.length < 4) {
      setErr(t.errMinLen);
      return;
    }
    if (creating && pw !== pw2) {
      setErr(t.errMismatch);
      return;
    }
    setBusy(true);
    try {
      const id = email.trim().toLowerCase();
      // Allow a plain username (e.g. "admin") — mapped to a synthetic email for
      // the auth backend. The same value is the encryption-key salt.
      const cleanEmail = id.includes('@') ? id : `${id}@vault.local`;
      const keys = await deriveKeys(cleanEmail, pw);
      if (creating) {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, authHash: keys.authHash }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || t.errCreate);
        }
      }
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, authHash: keys.authHash }),
      });
      if (!loginRes.ok) {
        const d = await loginRes.json().catch(() => ({}));
        throw new Error(d.error || t.errLogin);
      }
      // Remember the email (the username/salt, not secret) so biometric unlock
      // can refresh the session later.
      try { localStorage.setItem('vault-email', cleanEmail); } catch { /* ignore */ }
      onUnlock(keys);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  const label = 'block text-xs uppercase tracking-wide text-neutral-400 mb-1.5';
  const field =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#5b8cff] transition';

  const langToggle = (
    <div className="flex items-center rounded-full border border-white/10 text-[11px] font-bold overflow-hidden">
      <button type="button" onClick={() => setLang('id')} className={`px-2.5 py-1 transition ${lang === 'id' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}>ID</button>
      <button type="button" onClick={() => setLang('en')} className={`px-2.5 py-1 transition ${lang === 'en' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}>EN</button>
    </div>
  );

  return (
    <div className="min-h-screen w-full grid md:grid-cols-2 bg-[#05070c] text-white">
      {/* ── Panel brand / 3D kiri ── */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden border-r border-white/5 bg-gradient-to-br from-[#0b1020] to-[#05070c] p-10">
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-[#5b8cff]/20 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#7c5cff]/15 blur-[120px]" />

        <Link href="/" className="relative z-10 font-extrabold text-lg tracking-tight w-fit">
          🔐 my<span className="text-[#5b8cff]">Vault</span>
        </Link>

        <div className="relative z-0 flex-1 min-h-[300px] -my-2 flex items-center justify-center">
          <VaultPreview />
        </div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold">{t.panelTitle}</h2>
          <p className="mt-2 text-neutral-400 text-sm max-w-sm">{t.panelDesc}</p>
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-neutral-300 max-w-sm">
            {t.chips.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <span className="text-[#2bb079]">✓</span> {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Panel form kanan ── */}
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute top-5 right-5 z-10">{langToggle}</div>
        <div className="pointer-events-none absolute top-1/3 right-0 h-72 w-72 rounded-full bg-[#5b8cff]/10 blur-[120px] md:hidden" />
        <div className="relative w-full max-w-sm">
          <Link href="/" className="md:hidden mb-8 inline-block font-extrabold text-lg">
            🔐 my<span className="text-[#5b8cff]">Vault</span>
          </Link>

          {setup === null ? (
            <p className="text-neutral-400 text-sm">{t.loading}</p>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{creating ? t.titleCreate : t.titleLogin}</h1>
              <p className="mt-1.5 text-neutral-400 text-sm">{creating ? t.subCreate : t.subLogin}</p>

              {creating && (
                <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-200/80 leading-relaxed">
                  {t.warn}
                </div>
              )}

              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label className={label}>{t.labelId}</label>
                  <input
                    className={field}
                    type="text"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin"
                  />
                </div>

                <div>
                  <label className={label}>{t.labelPw}</label>
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
                    <label className={label}>{t.labelPw2}</label>
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
                  {busy ? t.btnBusy : creating ? t.btnCreate : t.btnOpen}
                </button>
              </form>

              {!creating && bioOn && (
                <button
                  type="button"
                  onClick={bioUnlock}
                  disabled={bioBusy}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 py-3 font-semibold text-white hover:bg-white/10 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span className="text-lg">👆</span>
                  {bioBusy ? t.bioBusy : t.bioBtn}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const L = {
  id: {
    loading: 'Memuat…',
    titleCreate: 'Siapkan brankas kamu',
    titleLogin: 'Selamat datang kembali',
    subCreate: 'Buat master password untuk brankas kamu.',
    subLogin: 'Masukkan email dan master password untuk membuka.',
    warn: '⚠️ Master password kamu mengenkripsi semuanya dan nggak pernah dikirim ke server. Lupa = data hilang permanen — nggak ada reset.',
    labelId: 'ID / Username',
    labelPw: 'Master password',
    labelPw2: 'Konfirmasi master password',
    btnBusy: 'Memproses…',
    btnCreate: 'Buat brankas',
    btnOpen: 'Buka',
    bioBusy: 'Memverifikasi…',
    bioBtn: 'Buka pakai biometrik',
    panelTitle: 'Terenkripsi di perangkat kamu.',
    panelDesc: 'Master password kamu satu-satunya kunci. Server nggak nyimpen apa pun selain ciphertext — bahkan kami nggak bisa baca brankas kamu.',
    chips: ['AES-256-GCM', 'Zero-knowledge', 'Jalan di HP', 'Privat'],
    errMinLen: 'Password minimal 4 karakter',
    errMismatch: 'Master password nggak cocok',
    errCreate: 'Gagal membuat brankas',
    errLogin: 'Email atau master password salah',
    errExpired: 'Sesi kedaluwarsa — masuk pakai master password dulu',
    errBio: 'Gagal buka dengan biometrik',
    errGeneric: 'Gagal',
  },
  en: {
    loading: 'Loading…',
    titleCreate: 'Set up your vault',
    titleLogin: 'Welcome back',
    subCreate: 'Create a master password for your vault.',
    subLogin: 'Enter your email and master password to unlock.',
    warn: '⚠️ Your master password encrypts everything and is never sent to the server. Forget it = data lost permanently — there is no reset.',
    labelId: 'ID / Username',
    labelPw: 'Master password',
    labelPw2: 'Confirm master password',
    btnBusy: 'Processing…',
    btnCreate: 'Create vault',
    btnOpen: 'Unlock',
    bioBusy: 'Verifying…',
    bioBtn: 'Unlock with biometrics',
    panelTitle: 'Encrypted on your device.',
    panelDesc: 'Your master password is the only key. The server stores nothing but ciphertext — even we can’t read your vault.',
    chips: ['AES-256-GCM', 'Zero-knowledge', 'Works on mobile', 'Private'],
    errMinLen: 'Password must be at least 4 characters',
    errMismatch: 'Master passwords don’t match',
    errCreate: 'Couldn’t create the vault',
    errLogin: 'Wrong email or master password',
    errExpired: 'Session expired — sign in with your master password first',
    errBio: 'Biometric unlock failed',
    errGeneric: 'Something went wrong',
  },
} as const;
