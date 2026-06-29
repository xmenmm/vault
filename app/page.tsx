'use client';

import Link from 'next/link';
import { VaultPreview } from '@/components/VaultPreview';
import { Reveal } from '@/components/Reveal';
import { Logo } from '@/components/Logo';
import { useLang } from '@/lib/i18n';

export default function Landing() {
  const [lang, setLang] = useLang();
  const t = COPY[lang];

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#05070c] text-white antialiased selection:bg-[#5b8cff]/30">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-44 -left-40 h-[540px] w-[540px] rounded-full bg-[#5b8cff]/20 blur-[150px]" />
      <div className="pointer-events-none absolute top-[34%] -right-44 h-[480px] w-[480px] rounded-full bg-[#7c5cff]/20 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-[6%] left-1/4 h-[420px] w-[420px] rounded-full bg-[#5b8cff]/10 blur-[150px]" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#05070c]/60 border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 sm:px-10 h-16">
          <div className="font-extrabold text-lg tracking-tight">
            <Logo accent="#7aa2ff" size={24} />
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
            <a href="#features" className="link-underline hover:text-white transition">{t.nav.features}</a>
            <a href="#how" className="link-underline hover:text-white transition">{t.nav.how}</a>
            <a href="#security" className="link-underline hover:text-white transition">{t.nav.security}</a>
            <a href="#faq" className="link-underline hover:text-white transition">{t.nav.faq}</a>
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-white/10 text-[11px] font-bold overflow-hidden">
              <button
                onClick={() => setLang('id')}
                className={`px-2.5 py-1.5 transition ${lang === 'id' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
              >
                ID
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1.5 transition ${lang === 'en' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
              >
                EN
              </button>
            </div>
            <Link
              href="/login"
              className="btn-shine text-sm font-semibold rounded-full bg-white text-black px-5 py-2.5 hover:bg-neutral-100 transition shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset]"
            >
              {t.openVault}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative w-full px-6 sm:px-10 pt-16 md:pt-24 pb-20">
        <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[640px]" />
        <div className="relative mx-auto max-w-7xl grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Reveal className="relative z-10">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-[#9db4ff] bg-[#5b8cff]/10 border border-[#5b8cff]/25 rounded-full px-3.5 py-1.5 uppercase">
              <LockIcon className="w-3.5 h-3.5" /> {t.heroBadge}
            </span>
            <h1 className="mt-6 text-[2.7rem] leading-[1.04] md:text-6xl lg:text-[4.1rem] font-bold tracking-[-0.03em]">
              {t.heroTitle1}
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8fb0ff] via-[#a78bff] to-[#7c5cff]">
                {t.heroTitle2}
              </span>
            </h1>
            <p className="mt-6 text-neutral-300/90 text-lg max-w-lg leading-relaxed">{t.heroDesc}</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="btn-shine group rounded-full bg-gradient-to-r from-[#5b8cff] to-[#7c5cff] text-white font-semibold px-7 py-3.5 shadow-[0_10px_34px_-8px_rgba(91,140,255,0.65)] hover:shadow-[0_14px_44px_-6px_rgba(124,92,255,0.75)] transition-all"
              >
                {t.heroCta}{' '}
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a href="#how" className="rounded-full border border-white/12 px-6 py-3.5 text-sm font-medium text-neutral-300 hover:bg-white/[0.04] hover:border-white/20 transition">
                {t.heroCta2}
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-400">
              {t.heroChips.map((c) => (
                <span key={c} className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#2bb079]" /> {c}</span>
              ))}
            </div>
          </Reveal>

          <div className="relative h-[440px] md:h-[520px] lg:h-[580px]">
            <VaultPreview />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative w-full px-6 sm:px-10 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7aa2ff]">{t.featuresKicker}</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-0.02em]">{t.featuresTitle}</h2>
            <p className="mt-4 text-neutral-400 leading-relaxed">{t.featuresSub}</p>
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
                <div className="card-premium group h-full rounded-2xl bg-white/[0.025] backdrop-blur-sm p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5b8cff]/25 to-[#7c5cff]/10 border border-white/10 grid place-items-center text-[#9db4ff] group-hover:scale-105 group-hover:text-white transition">
                    {FEATURE_ICONS[i]}
                  </div>
                  <h3 className="mt-5 font-semibold text-lg tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-neutral-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Spec band ── */}
      <section className="relative w-full px-6 sm:px-10 py-6">
        <Reveal className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-[24px] border border-white/[0.07] bg-white/[0.02] p-8 md:p-10">
            {t.specs.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#8fb0ff] to-[#7c5cff]">
                  {s.value}
                </div>
                <div className="mt-1.5 text-xs md:text-sm text-neutral-400">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="relative w-full px-6 sm:px-10 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7aa2ff]">{t.howKicker}</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-0.02em]">{t.howTitle}</h2>
          </Reveal>
          <div className="relative mt-14 grid md:grid-cols-3 gap-5">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden md:block h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {t.steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <div className="card-premium relative h-full rounded-2xl bg-white/[0.025] backdrop-blur-sm p-7">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#05070c] border border-white/10 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-[#8fb0ff] to-[#5b8cff]">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="mt-4 font-semibold text-lg tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-neutral-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security band ── */}
      <section id="security" className="relative w-full px-6 sm:px-10 py-12 md:py-16">
        <Reveal className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-[#0b1020] to-[#0a0a14] p-8 md:p-14 grid md:grid-cols-2 gap-12 items-center">
            <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#7c5cff]/15 blur-[110px]" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7aa2ff]">{t.secKicker}</p>
              <h2 className="mt-3 text-3xl md:text-[2.6rem] leading-[1.1] font-bold tracking-[-0.02em]">
                {t.secTitle1}<span className="text-[#7aa2ff]">{t.secTitleEm}</span>{t.secTitle2}
              </h2>
              <p className="mt-5 text-neutral-300/90 leading-relaxed max-w-md">{t.secDesc}</p>
              <ul className="mt-7 space-y-3.5 text-sm">
                {t.security.map((s) => (
                  <li key={s} className="flex items-start gap-3 text-neutral-300">
                    <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-[#2bb079]/15 border border-[#2bb079]/30">
                      <CheckIcon className="w-3 h-3 text-[#2bb079]" />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
              <Link href="/security" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7aa2ff] hover:text-white transition">
                {t.secLearnMore} →
              </Link>
            </div>

            <div className="relative rounded-2xl border border-white/[0.08] bg-[#080a10] overflow-hidden shadow-2xl">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-[11px] tracking-wide text-neutral-500 font-mono">vault_items · 1 row</span>
              </div>
              <div className="p-5 font-mono text-[13px] leading-relaxed">
                <div className="text-neutral-600">{t.codeComment1}</div>
                <div className="mt-3 text-[#7aa2ff]">{t.codeTitle}</div>
                <div className="text-neutral-400 break-all">3a9f:c1d4e7…a8b2 <span className="text-[#e0503c]">✗ {t.codeUnreadable}</span></div>
                <div className="mt-3 text-[#7aa2ff]">{t.codePassword}</div>
                <div className="text-neutral-400 break-all">7f20:9e0c11…4d6f <span className="text-[#e0503c]">✗ {t.codeUnreadable}</span></div>
                <div className="mt-5 text-neutral-600">{t.codeComment2}</div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Logo cloud (marquee) ── */}
      <section className="relative w-full px-6 sm:px-10 pb-24 pt-10">
        <Reveal className="mx-auto max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-[-0.02em]">{t.cloudTitle}</h2>
          <p className="mt-3 text-neutral-400 text-center max-w-xl mx-auto">{t.cloudSub}</p>
          <div className="logo-cloud-mask mt-12 overflow-hidden">
            <div className="logo-track">
              {[...LOGOS, ...LOGOS].map((l, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={`https://cdn.simpleicons.org/${l.slug}/8a93a6`}
                  alt={l.name}
                  width={28}
                  height={28}
                  loading="lazy"
                  className="mx-9 h-7 w-auto shrink-0 opacity-70 hover:opacity-100 transition"
                />
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative w-full px-6 sm:px-10 py-20 md:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7aa2ff]">{t.faqKicker}</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-0.02em]">{t.faqTitle}</h2>
          </Reveal>
          <div className="mt-12 space-y-3">
            {t.faqs.map((f, i) => (
              <Reveal key={i} delay={(i % 3) * 0.06}>
                <details className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-[15px]">
                    {f.q}
                    <span className="ml-4 flex-none text-xl leading-none text-neutral-500 transition-transform duration-200 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-neutral-400 text-sm leading-relaxed">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative w-full px-6 sm:px-10 py-20 md:py-28">
        <Reveal className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent px-8 py-16 md:py-20 text-center">
            <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#5b8cff]/60 to-transparent" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[#5b8cff]/15 blur-[100px]" />
            <h2 className="relative text-4xl md:text-5xl font-bold tracking-[-0.02em]">{t.ctaTitle}</h2>
            <p className="relative mt-4 text-neutral-400 max-w-md mx-auto">{t.ctaDesc}</p>
            <Link
              href="/login"
              className="btn-shine relative mt-9 inline-block rounded-full bg-gradient-to-r from-[#5b8cff] to-[#7c5cff] text-white font-semibold px-9 py-4 shadow-[0_12px_40px_-8px_rgba(91,140,255,0.7)] hover:shadow-[0_16px_50px_-6px_rgba(124,92,255,0.8)] transition-all"
            >
              {t.ctaBtn}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-neutral-500">
          <div className="font-extrabold text-white">
            <Logo accent="#7aa2ff" size={22} />
          </div>
          <div>{t.footer}</div>
        </div>
      </footer>
    </main>
  );
}

/* ── icons (order matches each language's `features` array) ── */
const FEATURE_ICONS = [
  <ShieldIcon key="0" />,
  <LayersIcon key="1" />,
  <BoltIcon key="2" />,
  <ScanIcon key="3" />,
  <FingerprintIcon key="4" />,
  <DiceIcon key="5" />,
  <PhoneIcon key="6" />,
  <ImportIcon key="7" />,
  <TimerIcon key="8" />,
];

/* ── copy (id / en) ── */
const COPY = {
  id: {
    nav: { features: 'Fitur', how: 'Cara kerja', security: 'Keamanan', faq: 'FAQ' },
    openVault: 'Buka brankas',
    heroBadge: 'Enkripsi Zero-Knowledge',
    heroTitle1: 'Password kamu,',
    heroTitle2: 'terenkripsi penuh.',
    heroDesc: 'Satu brankas buat semua login — Facebook, Gmail, apa pun. Dikunci pakai master password yang cuma kamu tahu. Server, kami, siapa pun — nggak ada yang bisa baca.',
    heroCta: 'Buka brankas kamu',
    heroCta2: 'Lihat cara kerja',
    heroChips: ['AES-256-GCM', 'Jalan di HP', 'Tanpa pelacakan'],
    featuresKicker: 'Fitur',
    featuresTitle: 'Dibangun kayak brankas bank.',
    featuresSub: 'Semua dienkripsi di perangkat kamu sebelum keluar. Ini yang kamu dapat.',
    features: [
      { title: 'Zero-knowledge', desc: 'Dienkripsi di browser kamu pakai AES-256-GCM. Server nggak pernah lihat password asli.' },
      { title: 'Brankas serba-bisa', desc: 'Bukan cuma login — simpan kartu kredit, catatan aman, & identitas di satu tempat.' },
      { title: '2FA / TOTP bawaan', desc: 'Kode 2FA berputar otomatis di tiap entri. Nggak perlu app authenticator terpisah.' },
      { title: 'Cek kebocoran', desc: 'Tahu kalau password kamu pernah bocor (HaveIBeenPwned) — tanpa pernah ngirim password aslinya.' },
      { title: 'Buka pakai biometrik', desc: 'Sidik jari atau wajah buat buka cepat. Master password tetap selalu bisa dipakai.' },
      { title: 'Generator kuat', desc: 'Password acak atau frasa mudah-diingat, lengkap dengan estimasi waktu jebol.' },
      { title: 'Jalan offline (PWA)', desc: 'Install di HP, buka layar penuh, dan tetap kebuka walau tanpa internet.' },
      { title: 'Pindah gampang', desc: 'Import dari Chrome & manager lain lewat CSV, lalu ekspor kapan pun kamu mau.' },
      { title: 'Kunci otomatis', desc: 'Mengunci sendiri saat idle, hapus kunci dari memori, & auto-bersih clipboard.' },
    ],
    specs: [
      { value: 'AES-256', label: 'Enkripsi GCM terautentikasi' },
      { value: '600k', label: 'Putaran PBKDF2 per kunci' },
      { value: '4 tipe', label: 'Login · kartu · catatan · identitas' },
      { value: '0', label: 'Pelacak & data dikumpulkan' },
    ],
    howKicker: 'Cara kerja',
    howTitle: 'Siap pakai dalam semenit.',
    steps: [
      { title: 'Set master password', desc: 'Pilih satu password kuat yang kamu inget. Itu jadi kunci enkripsi kamu.' },
      { title: 'Tambah login kamu', desc: 'Simpan Facebook, Gmail, bank — apa pun — pakai generator bawaan.' },
      { title: 'Akses di mana aja', desc: 'Sekali deploy, buka dari perangkat mana pun. Semuanya didekripsi seketika.' },
    ],
    secKicker: 'Keamanan',
    secTitle1: 'Bahkan ',
    secTitleEm: 'kami',
    secTitle2: ' nggak bisa baca.',
    secDesc: 'Master password kamu diubah jadi kunci enkripsi di dalam browser dengan 600.000 putaran PBKDF2 — dan nggak pernah keluar dari perangkat kamu. Server cuma menyimpan ciphertext yang teracak.',
    secLearnMore: 'Pelajari keamanannya',
    security: [
      'Master password nggak pernah dikirim — cuma hash satu-arah.',
      'Enkripsi terautentikasi AES-256-GCM di tiap entri.',
      'Row-level security mengisolasi tiap akun di database.',
      'Nggak ada reset password — karena cuma kamu yang bisa dekripsi.',
    ],
    codeComment1: '// yang sebenarnya disimpan server',
    codeTitle: 'judul',
    codePassword: 'password',
    codeUnreadable: 'nggak terbaca',
    codeComment2: '// cuma master password kamu yang bisa dekripsi',
    cloudTitle: 'Satu brankas buat semua akunmu.',
    cloudSub: 'Google, GitHub, Instagram, bank — apa pun. Simpan semua login favoritmu, aman di satu tempat.',
    faqKicker: 'FAQ',
    faqTitle: 'Pertanyaan umum.',
    faqs: [
      { q: 'Apakah benar-benar aman?', a: 'Ya. Semua dienkripsi di perangkat kamu dengan AES-256-GCM sebelum dikirim. Server cuma menyimpan ciphertext yang teracak — bahkan kami nggak bisa membacanya.' },
      { q: 'Gimana kalau saya lupa master password?', a: 'Master password adalah satu-satunya kunci dan nggak pernah disimpan. Kalau lupa, datanya nggak bisa dipulihkan — jadi catat baik-baik. Ini konsekuensi wajar dari keamanan zero-knowledge.' },
      { q: 'Bisa dipakai di HP?', a: 'Bisa. Buka di browser HP, atau install sebagai aplikasi (PWA) buat akses layar penuh & offline. Buka pakai sidik jari atau wajah juga didukung.' },
      { q: 'Bisa pindah dari Chrome atau manager lain?', a: 'Bisa. Ekspor password kamu ke CSV dari sana, lalu impor di myVault — kolomnya dikenali otomatis. Kamu juga bisa ekspor balik kapan pun.' },
      { q: 'Selain password, apa lagi yang bisa disimpan?', a: 'Kartu kredit, catatan aman, dan identitas (KTP/paspor) — plus kode 2FA/TOTP yang berputar otomatis di tiap akun, jadi nggak perlu app authenticator terpisah.' },
    ],
    ctaTitle: 'Ambil alih password kamu.',
    ctaDesc: 'Terenkripsi, dan milik kamu sepenuhnya. Buka pakai master password, langsung masuk.',
    ctaBtn: 'Buka brankas kamu →',
    footer: 'Dienkripsi di perangkat kamu · Cuma kamu yang pegang kuncinya',
  },
  en: {
    nav: { features: 'Features', how: 'How it works', security: 'Security', faq: 'FAQ' },
    openVault: 'Open vault',
    heroBadge: 'Zero-Knowledge Encryption',
    heroTitle1: 'Your passwords,',
    heroTitle2: 'fully encrypted.',
    heroDesc: 'One vault for every login — Facebook, Gmail, anything. Locked with a master password only you know. The server, us, anyone — no one can read it.',
    heroCta: 'Open your vault',
    heroCta2: 'See how it works',
    heroChips: ['AES-256-GCM', 'Works on mobile', 'No tracking'],
    featuresKicker: 'Features',
    featuresTitle: 'Built like a bank vault.',
    featuresSub: 'Everything is encrypted on your device before it leaves. Here is what you get.',
    features: [
      { title: 'Zero-knowledge', desc: 'Encrypted in your browser with AES-256-GCM. The server never sees your real password.' },
      { title: 'All-in-one vault', desc: 'Not just logins — store credit cards, secure notes, and identities in one place.' },
      { title: 'Built-in 2FA / TOTP', desc: 'Rotating 2FA codes on every entry. No separate authenticator app needed.' },
      { title: 'Breach check', desc: 'Find out if your password has ever leaked (HaveIBeenPwned) — without ever sending the password itself.' },
      { title: 'Biometric unlock', desc: 'Fingerprint or face to open fast. Your master password always still works.' },
      { title: 'Strong generator', desc: 'Random passwords or memorable passphrases, with a time-to-crack estimate.' },
      { title: 'Works offline (PWA)', desc: 'Install on your phone, open full-screen, and it still works without internet.' },
      { title: 'Easy migration', desc: 'Import from Chrome and other managers via CSV, then export whenever you want.' },
      { title: 'Auto-lock', desc: 'Locks itself when idle, wipes the key from memory, and auto-clears the clipboard.' },
    ],
    specs: [
      { value: 'AES-256', label: 'Authenticated GCM encryption' },
      { value: '600k', label: 'PBKDF2 rounds per key' },
      { value: '4 types', label: 'Login · card · note · identity' },
      { value: '0', label: 'Trackers & data collected' },
    ],
    howKicker: 'How it works',
    howTitle: 'Ready in a minute.',
    steps: [
      { title: 'Set a master password', desc: 'Pick one strong password you will remember. It becomes your encryption key.' },
      { title: 'Add your logins', desc: 'Save Facebook, Gmail, your bank — anything — with the built-in generator.' },
      { title: 'Access anywhere', desc: 'Deploy once, open from any device. Everything is decrypted instantly.' },
    ],
    secKicker: 'Security',
    secTitle1: 'Even ',
    secTitleEm: 'we',
    secTitle2: ' can’t read it.',
    secDesc: 'Your master password is turned into an encryption key inside the browser with 600,000 PBKDF2 rounds — and never leaves your device. The server only stores scrambled ciphertext.',
    secLearnMore: 'Learn about our security',
    security: [
      'The master password is never sent — only a one-way hash.',
      'Authenticated AES-256-GCM encryption on every entry.',
      'Row-level security isolates each account in the database.',
      'No password reset — because only you can decrypt.',
    ],
    codeComment1: '// what the server actually stores',
    codeTitle: 'title',
    codePassword: 'password',
    codeUnreadable: 'unreadable',
    codeComment2: '// only your master password can decrypt',
    cloudTitle: 'One vault for all your accounts.',
    cloudSub: 'Google, GitHub, Instagram, your bank — anything. Keep all your favorite logins safe in one place.',
    faqKicker: 'FAQ',
    faqTitle: 'Frequently asked.',
    faqs: [
      { q: 'Is it really secure?', a: 'Yes. Everything is encrypted on your device with AES-256-GCM before it is sent. The server only stores scrambled ciphertext — even we can’t read it.' },
      { q: 'What if I forget my master password?', a: 'The master password is the only key and is never stored. If you forget it, the data can’t be recovered — so write it down carefully. That is the natural trade-off of zero-knowledge security.' },
      { q: 'Can I use it on mobile?', a: 'Yes. Open it in your phone’s browser, or install it as an app (PWA) for full-screen and offline access. Unlocking with fingerprint or face is supported too.' },
      { q: 'Can I move from Chrome or another manager?', a: 'Yes. Export your passwords to CSV from there, then import them in myVault — the columns are detected automatically. You can also export back anytime.' },
      { q: 'Besides passwords, what else can it store?', a: 'Credit cards, secure notes, and identities (ID/passport) — plus 2FA/TOTP codes that rotate automatically on every account.' },
    ],
    ctaTitle: 'Take back your passwords.',
    ctaDesc: 'Encrypted, and entirely yours. Open with your master password and you are in.',
    ctaBtn: 'Open your vault →',
    footer: 'Encrypted on your device · Only you hold the key',
  },
} as const;

// Brands whose logins you can keep in the vault — rendered as a grayscale
// marquee. Monochrome SVGs from the simple-icons CDN, tinted to --muted.
const LOGOS = [
  { name: 'Google', slug: 'google' },
  { name: 'GitHub', slug: 'github' },
  { name: 'Instagram', slug: 'instagram' },
  { name: 'Facebook', slug: 'facebook' },
  { name: 'X', slug: 'x' },
  { name: 'Netflix', slug: 'netflix' },
  { name: 'Spotify', slug: 'spotify' },
  { name: 'YouTube', slug: 'youtube' },
  { name: 'PayPal', slug: 'paypal' },
  { name: 'Discord', slug: 'discord' },
  { name: 'WhatsApp', slug: 'whatsapp' },
  { name: 'TikTok', slug: 'tiktok' },
];

/* ── inline icons ── */
function Base({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? 'w-6 h-6'}
    >
      {children}
    </svg>
  );
}
function LockIcon({ className }: { className?: string }) {
  return <Base className={className}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Base>;
}
function ShieldIcon() { return <Base><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></Base>; }
function PhoneIcon() { return <Base><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></Base>; }
function DiceIcon() { return <Base><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1" fill="currentColor" /><circle cx="15.5" cy="15.5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /></Base>; }
function TimerIcon() { return <Base><circle cx="12" cy="13" r="8" /><path d="M12 13V9M9 2h6" /></Base>; }
function CheckIcon({ className }: { className?: string }) { return <Base className={className}><path d="m20 6-11 11-5-5" /></Base>; }
function LayersIcon() { return <Base><path d="m12 2 9 5-9 5-9-5 9-5z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></Base>; }
function BoltIcon() { return <Base><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></Base>; }
function ScanIcon() { return <Base><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" /><path d="M4 12h16" /></Base>; }
function FingerprintIcon() { return <Base><path d="M12 10a2 2 0 0 0-2 2c0 2 .4 4-1 6" /><path d="M6.5 8a6 6 0 0 1 11 4c0 1 0 2-.3 3" /><path d="M9 6.5a6 6 0 0 0-3 5.5c0 3-1 5-2 6" /><path d="M12 14c0 3 0 5-1 7" /><path d="M15.5 16c-.4 2-1 3.5-2 5" /></Base>; }
function ImportIcon() { return <Base><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></Base>; }
