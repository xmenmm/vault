'use client';

import Link from 'next/link';
import { Reveal } from '@/components/Reveal';
import { useLang } from '@/lib/i18n';
import { Logo } from '@/components/Logo';

export default function SecurityPage() {
  const [lang, setLang] = useLang();
  const t = COPY[lang];

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#05070c] text-white antialiased selection:bg-[#5b8cff]/30">
      <div className="pointer-events-none absolute -top-44 -left-40 h-[540px] w-[540px] rounded-full bg-[#5b8cff]/20 blur-[150px]" />
      <div className="pointer-events-none absolute top-[40%] -right-44 h-[480px] w-[480px] rounded-full bg-[#7c5cff]/18 blur-[150px]" />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#05070c]/60 border-b border-white/[0.06]">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 sm:px-10 h-16">
          <Link href="/" className="font-extrabold text-lg tracking-tight"><Logo accent="#7aa2ff" size={24} /></Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-white/10 text-[11px] font-bold overflow-hidden">
              <button onClick={() => setLang('id')} className={`px-2.5 py-1.5 transition ${lang === 'id' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}>ID</button>
              <button onClick={() => setLang('en')} className={`px-2.5 py-1.5 transition ${lang === 'en' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}>EN</button>
            </div>
            <Link href="/login" className="text-sm font-semibold rounded-full bg-white text-black px-5 py-2.5 hover:bg-neutral-100 transition">{t.openVault}</Link>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-3xl px-6 sm:px-10 py-16 md:py-24">
        {/* Hero */}
        <Reveal>
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-[#9db4ff] bg-[#5b8cff]/10 border border-[#5b8cff]/25 rounded-full px-3.5 py-1.5 uppercase">{t.kicker}</span>
          <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-[-0.03em] leading-tight">{t.title}</h1>
          <p className="mt-5 text-lg text-neutral-300/90 leading-relaxed">{t.intro}</p>
        </Reveal>

        {/* Flow */}
        <Reveal className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">{t.flowTitle}</h2>
          <p className="mt-3 text-neutral-400 leading-relaxed">{t.flowIntro}</p>
          <ol className="mt-7 space-y-4">
            {t.flow.map((s, i) => (
              <li key={i} className="flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-[#05070c] border border-white/10 font-mono text-sm font-bold text-[#9db4ff]">{i + 1}</div>
                <div>
                  <div className="font-semibold">{s.h}</div>
                  <p className="mt-1 text-sm text-neutral-400 leading-relaxed">{s.p}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* What the server sees */}
        <Reveal className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">{t.storeTitle}</h2>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[#2bb079]/25 bg-[#2bb079]/[0.06] p-5">
              <div className="text-sm font-semibold text-[#2bb079]">{t.youSee}</div>
              <div className="mt-3 font-mono text-[13px] text-neutral-200 break-all">netflix · you@email.com · S0me-Str0ng!pw</div>
            </div>
            <div className="rounded-2xl border border-[#e0503c]/25 bg-[#e0503c]/[0.06] p-5">
              <div className="text-sm font-semibold text-[#e0503c]">{t.serverSees}</div>
              <div className="mt-3 font-mono text-[13px] text-neutral-400 break-all">7f20:9e0c11…4d6f <span className="text-[#e0503c]">✗</span></div>
            </div>
          </div>
        </Reveal>

        {/* Threat model */}
        <Reveal className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">{t.threatTitle}</h2>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="text-sm font-semibold text-[#9db4ff]">{t.protectedTitle}</div>
              <ul className="mt-3 space-y-2.5 text-sm text-neutral-300">
                {t.protected.map((x) => (<li key={x} className="flex items-start gap-2"><span className="text-[#2bb079] mt-0.5">✓</span>{x}</li>))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="text-sm font-semibold text-[#e0a13c]">{t.yourPartTitle}</div>
              <ul className="mt-3 space-y-2.5 text-sm text-neutral-300">
                {t.yourPart.map((x) => (<li key={x} className="flex items-start gap-2"><span className="text-[#e0a13c] mt-0.5">!</span>{x}</li>))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* Specs */}
        <Reveal className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">{t.specsTitle}</h2>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {t.specs.map((s) => (
              <div key={s.k} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                <div className="font-mono text-[#9db4ff] font-semibold">{s.k}</div>
                <div className="mt-1 text-xs text-neutral-400">{s.v}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Trade-off */}
        <Reveal className="mt-16">
          <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/[0.05] p-6 md:p-8">
            <h2 className="text-xl font-bold tracking-tight text-amber-200">{t.tradeoffTitle}</h2>
            <p className="mt-3 text-neutral-300/90 leading-relaxed text-sm">{t.tradeoff}</p>
          </div>
        </Reveal>

        {/* Report */}
        <Reveal className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">{t.reportTitle}</h2>
          <p className="mt-3 text-neutral-400 leading-relaxed">{t.reportIntro} <a href="/.well-known/security.txt" className="text-[#7aa2ff] underline">security.txt</a>.</p>
        </Reveal>

        {/* CTA */}
        <Reveal className="mt-16 text-center">
          <Link href="/login" className="inline-block rounded-full bg-gradient-to-r from-[#5b8cff] to-[#7c5cff] text-white font-semibold px-8 py-3.5 shadow-[0_10px_34px_-8px_rgba(91,140,255,0.65)] hover:shadow-[0_14px_44px_-6px_rgba(124,92,255,0.75)] transition-all">{t.cta} →</Link>
        </Reveal>
      </div>

      <footer className="relative border-t border-white/[0.06]">
        <div className="mx-auto max-w-5xl px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-neutral-500">
          <Link href="/" className="font-extrabold text-white"><Logo accent="#7aa2ff" size={22} /></Link>
          <div>{t.footer}</div>
        </div>
      </footer>
    </main>
  );
}

const COPY = {
  id: {
    openVault: 'Buka brankas',
    kicker: 'Keamanan',
    title: 'Cara kami menjaga brankas kamu',
    intro: 'myVault dibangun zero-knowledge: semua dienkripsi di perangkat kamu sebelum keluar. Server cuma menyimpan ciphertext teracak — bahkan kami, sebagai pembuat, secara teknis nggak bisa membaca isi brankas kamu.',
    flowTitle: 'Alur enkripsi (semua di browser kamu)',
    flowIntro: 'Master password kamu nggak pernah dikirim ke mana pun. Dari dia, browser menurunkan kunci-kunci berikut:',
    flow: [
      { h: 'Master password → master key', p: 'PBKDF2-SHA256 dengan 600.000 putaran (lambat by design, biar brute-force mahal).' },
      { h: 'master key → kunci enkripsi', p: 'HKDF-SHA256 menurunkan kunci AES-256-GCM yang mengenkripsi tiap entri (judul, username, password, semuanya).' },
      { h: 'master key → auth hash', p: 'Nilai satu-arah dikirim ke server hanya untuk login. Server nggak bisa balik jadi master password kamu.' },
      { h: 'Dekripsi', p: 'Saat buka, data didekripsi di browser pakai kunci yang baru diturunkan ulang dari master password. Kunci nggak pernah dikirim.' },
    ],
    storeTitle: 'Apa yang server simpan',
    youSee: 'Yang kamu lihat',
    serverSees: 'Yang server lihat',
    threatTitle: 'Model ancaman',
    protectedTitle: 'Terlindungi dari',
    protected: ['Bocornya database server (isinya ciphertext)', 'Pembuat/admin yang ingin mengintip', 'Penyadapan jaringan (TLS + enkripsi end-to-end)', 'Isolasi antar-akun (row-level security)'],
    yourPartTitle: 'Tanggung jawab kamu',
    yourPart: ['Pilih master password yang kuat & unik', 'Jangan bagikan master password ke siapa pun', 'Jaga keamanan perangkat kamu', 'Catat master password — nggak ada reset'],
    specsTitle: 'Spesifikasi teknis',
    specs: [
      { k: 'AES-256-GCM', v: 'Enkripsi terautentikasi' },
      { k: 'PBKDF2', v: '600.000 putaran SHA-256' },
      { k: 'HKDF-SHA256', v: 'Penurunan kunci' },
      { k: 'CSP', v: "connect-src dikunci" },
      { k: '0', v: 'Pelacak / analitik' },
      { k: 'iv:ciphertext', v: 'Disimpan per entri' },
    ],
    tradeoffTitle: 'Konsekuensi yang jujur: nggak ada reset password',
    tradeoff: 'Karena master password kamu satu-satunya kunci dan nggak pernah disimpan, kalau kamu lupa — datanya nggak bisa dipulihkan oleh siapa pun, termasuk kami. Ini harga dari keamanan sejati. Catat master password kamu baik-baik.',
    reportTitle: 'Lapor masalah keamanan',
    reportIntro: 'Nemu kerentanan? Kontak ada di',
    cta: 'Buka brankas kamu',
    footer: 'Dienkripsi di perangkat kamu · Cuma kamu yang pegang kuncinya',
  },
  en: {
    openVault: 'Open vault',
    kicker: 'Security',
    title: 'How we keep your vault safe',
    intro: 'myVault is built zero-knowledge: everything is encrypted on your device before it leaves. The server only stores scrambled ciphertext — even we, the makers, technically cannot read the contents of your vault.',
    flowTitle: 'The encryption flow (all in your browser)',
    flowIntro: 'Your master password is never sent anywhere. From it, the browser derives these keys:',
    flow: [
      { h: 'Master password → master key', p: 'PBKDF2-SHA256 with 600,000 rounds (deliberately slow, so brute-forcing is expensive).' },
      { h: 'Master key → encryption key', p: 'HKDF-SHA256 derives an AES-256-GCM key that encrypts every entry (title, username, password — all of it).' },
      { h: 'Master key → auth hash', p: 'A one-way value sent to the server only for login. The server can’t turn it back into your master password.' },
      { h: 'Decryption', p: 'When you open the vault, data is decrypted in the browser with the key re-derived from your master password. The key is never sent.' },
    ],
    storeTitle: 'What the server stores',
    youSee: 'What you see',
    serverSees: 'What the server sees',
    threatTitle: 'Threat model',
    protectedTitle: 'Protected against',
    protected: ['A server / database breach (it’s only ciphertext)', 'The makers or admins peeking', 'Network sniffing (TLS + end-to-end encryption)', 'Cross-account isolation (row-level security)'],
    yourPartTitle: 'Your responsibility',
    yourPart: ['Choose a strong, unique master password', 'Never share your master password', 'Keep your device secure', 'Write down your master password — there’s no reset'],
    specsTitle: 'Technical specs',
    specs: [
      { k: 'AES-256-GCM', v: 'Authenticated encryption' },
      { k: 'PBKDF2', v: '600,000 SHA-256 rounds' },
      { k: 'HKDF-SHA256', v: 'Key derivation' },
      { k: 'CSP', v: 'connect-src locked down' },
      { k: '0', v: 'Trackers / analytics' },
      { k: 'iv:ciphertext', v: 'Stored per entry' },
    ],
    tradeoffTitle: 'An honest trade-off: there’s no password reset',
    tradeoff: 'Because your master password is the only key and is never stored, if you forget it the data cannot be recovered by anyone — including us. That’s the price of real security. Write your master password down carefully.',
    reportTitle: 'Report a security issue',
    reportIntro: 'Found a vulnerability? Contact details are in',
    cta: 'Open your vault',
    footer: 'Encrypted on your device · Only you hold the key',
  },
} as const;
