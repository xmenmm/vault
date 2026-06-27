import Link from 'next/link';
import { VaultPreview } from '@/components/VaultPreview';
import { Reveal } from '@/components/Reveal';

export default function Landing() {
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
            🔐 my<span className="text-[#7aa2ff]">Vault</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
            <a href="#features" className="link-underline hover:text-white transition">Fitur</a>
            <a href="#how" className="link-underline hover:text-white transition">Cara kerja</a>
            <a href="#security" className="link-underline hover:text-white transition">Keamanan</a>
            <a href="#faq" className="link-underline hover:text-white transition">FAQ</a>
          </nav>
          <Link
            href="/login"
            className="btn-shine text-sm font-semibold rounded-full bg-white text-black px-5 py-2.5 hover:bg-neutral-100 transition shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset]"
          >
            Buka brankas
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative w-full px-6 sm:px-10 pt-16 md:pt-24 pb-20">
        <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[640px]" />
        <div className="relative mx-auto max-w-7xl grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Reveal className="relative z-10">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-[#9db4ff] bg-[#5b8cff]/10 border border-[#5b8cff]/25 rounded-full px-3.5 py-1.5 uppercase">
              <LockIcon className="w-3.5 h-3.5" /> Enkripsi Zero-Knowledge
            </span>
            <h1 className="mt-6 text-[2.7rem] leading-[1.04] md:text-6xl lg:text-[4.1rem] font-bold tracking-[-0.03em]">
              Password kamu,
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8fb0ff] via-[#a78bff] to-[#7c5cff]">
                terenkripsi penuh.
              </span>
            </h1>
            <p className="mt-6 text-neutral-300/90 text-lg max-w-lg leading-relaxed">
              Satu brankas buat semua login — Facebook, Gmail, apa pun. Dikunci pakai
              master password yang cuma kamu tahu. Server, kami, siapa pun — nggak ada
              yang bisa baca.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="btn-shine group rounded-full bg-gradient-to-r from-[#5b8cff] to-[#7c5cff] text-white font-semibold px-7 py-3.5 shadow-[0_10px_34px_-8px_rgba(91,140,255,0.65)] hover:shadow-[0_14px_44px_-6px_rgba(124,92,255,0.75)] transition-all"
              >
                Buka brankas kamu{' '}
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a href="#how" className="rounded-full border border-white/12 px-6 py-3.5 text-sm font-medium text-neutral-300 hover:bg-white/[0.04] hover:border-white/20 transition">
                Lihat cara kerja
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-400">
              <span className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#2bb079]" /> AES-256-GCM</span>
              <span className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#2bb079]" /> Jalan di HP</span>
              <span className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#2bb079]" /> Tanpa pelacakan</span>
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7aa2ff]">Fitur</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-0.02em]">Dibangun kayak brankas bank.</h2>
            <p className="mt-4 text-neutral-400 leading-relaxed">
              Semua dienkripsi di perangkat kamu sebelum keluar. Ini yang kamu dapat.
            </p>
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
                <div className="card-premium group h-full rounded-2xl bg-white/[0.025] backdrop-blur-sm p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5b8cff]/25 to-[#7c5cff]/10 border border-white/10 grid place-items-center text-[#9db4ff] group-hover:scale-105 group-hover:text-white transition">
                    {f.icon}
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
            {SPECS.map((s) => (
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7aa2ff]">Cara kerja</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-0.02em]">Siap pakai dalam semenit.</h2>
          </Reveal>
          <div className="relative mt-14 grid md:grid-cols-3 gap-5">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden md:block h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {STEPS.map((s, i) => (
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7aa2ff]">Keamanan</p>
              <h2 className="mt-3 text-3xl md:text-[2.6rem] leading-[1.1] font-bold tracking-[-0.02em]">
                Bahkan <span className="text-[#7aa2ff]">kami</span> nggak bisa baca.
              </h2>
              <p className="mt-5 text-neutral-300/90 leading-relaxed max-w-md">
                Master password kamu diubah jadi kunci enkripsi di dalam browser dengan
                600.000 putaran PBKDF2 — dan nggak pernah keluar dari perangkat kamu.
                Server cuma menyimpan ciphertext yang teracak.
              </p>
              <ul className="mt-7 space-y-3.5 text-sm">
                {SECURITY.map((s) => (
                  <li key={s} className="flex items-start gap-3 text-neutral-300">
                    <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-[#2bb079]/15 border border-[#2bb079]/30">
                      <CheckIcon className="w-3 h-3 text-[#2bb079]" />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative rounded-2xl border border-white/[0.08] bg-[#080a10] overflow-hidden shadow-2xl">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-[11px] tracking-wide text-neutral-500 font-mono">vault_items · 1 row</span>
              </div>
              <div className="p-5 font-mono text-[13px] leading-relaxed">
                <div className="text-neutral-600">// yang sebenarnya disimpan server</div>
                <div className="mt-3 text-[#7aa2ff]">judul</div>
                <div className="text-neutral-400 break-all">3a9f:c1d4e7…a8b2 <span className="text-[#e0503c]">✗ nggak terbaca</span></div>
                <div className="mt-3 text-[#7aa2ff]">password</div>
                <div className="text-neutral-400 break-all">7f20:9e0c11…4d6f <span className="text-[#e0503c]">✗ nggak terbaca</span></div>
                <div className="mt-5 text-neutral-600">// cuma master password kamu yang bisa dekripsi</div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Logo cloud (marquee) ── */}
      <section className="relative w-full px-6 sm:px-10 pb-24 pt-10">
        <Reveal className="mx-auto max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-[-0.02em]">Satu brankas buat semua akunmu.</h2>
          <p className="mt-3 text-neutral-400 text-center max-w-xl mx-auto">
            Google, GitHub, Instagram, bank — apa pun. Simpan semua login favoritmu, aman di satu tempat.
          </p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7aa2ff]">FAQ</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-0.02em]">Pertanyaan umum.</h2>
          </Reveal>
          <div className="mt-12 space-y-3">
            {FAQS.map((f, i) => (
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
            <h2 className="relative text-4xl md:text-5xl font-bold tracking-[-0.02em]">Ambil alih password kamu.</h2>
            <p className="relative mt-4 text-neutral-400 max-w-md mx-auto">
              Terenkripsi, dan milik kamu sepenuhnya. Buka pakai master password, langsung masuk.
            </p>
            <Link
              href="/login"
              className="btn-shine relative mt-9 inline-block rounded-full bg-gradient-to-r from-[#5b8cff] to-[#7c5cff] text-white font-semibold px-9 py-4 shadow-[0_12px_40px_-8px_rgba(91,140,255,0.7)] hover:shadow-[0_16px_50px_-6px_rgba(124,92,255,0.8)] transition-all"
            >
              Buka brankas kamu →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-neutral-500">
          <div className="font-extrabold text-white">
            🔐 my<span className="text-[#7aa2ff]">Vault</span>
          </div>
          <div>Dienkripsi di perangkat kamu · Cuma kamu yang pegang kuncinya</div>
        </div>
      </footer>
    </main>
  );
}

/* ── data ── */
const FEATURES = [
  { icon: <ShieldIcon />, title: 'Zero-knowledge', desc: 'Dienkripsi di browser kamu pakai AES-256-GCM. Server nggak pernah lihat password asli.' },
  { icon: <LayersIcon />, title: 'Brankas serba-bisa', desc: 'Bukan cuma login — simpan kartu kredit, catatan aman, & identitas di satu tempat.' },
  { icon: <BoltIcon />, title: '2FA / TOTP bawaan', desc: 'Kode 2FA berputar otomatis di tiap entri. Nggak perlu app authenticator terpisah.' },
  { icon: <ScanIcon />, title: 'Cek kebocoran', desc: 'Tahu kalau password kamu pernah bocor (HaveIBeenPwned) — tanpa pernah ngirim password aslinya.' },
  { icon: <FingerprintIcon />, title: 'Buka pakai biometrik', desc: 'Sidik jari atau wajah buat buka cepat. Master password tetap selalu bisa dipakai.' },
  { icon: <DiceIcon />, title: 'Generator kuat', desc: 'Password acak atau frasa mudah-diingat, lengkap dengan estimasi waktu jebol.' },
  { icon: <PhoneIcon />, title: 'Jalan offline (PWA)', desc: 'Install di HP, buka layar penuh, dan tetap kebuka walau tanpa internet.' },
  { icon: <ImportIcon />, title: 'Pindah gampang', desc: 'Import dari Chrome & manager lain lewat CSV, lalu ekspor kapan pun kamu mau.' },
  { icon: <TimerIcon />, title: 'Kunci otomatis', desc: 'Mengunci sendiri saat idle, hapus kunci dari memori, & auto-bersih clipboard.' },
];

const STEPS = [
  { title: 'Set master password', desc: 'Pilih satu password kuat yang kamu inget. Itu jadi kunci enkripsi kamu.' },
  { title: 'Tambah login kamu', desc: 'Simpan Facebook, Gmail, bank — apa pun — pakai generator bawaan.' },
  { title: 'Akses di mana aja', desc: 'Sekali deploy, buka dari perangkat mana pun. Semuanya didekripsi seketika.' },
];

const SECURITY = [
  'Master password nggak pernah dikirim — cuma hash satu-arah.',
  'Enkripsi terautentikasi AES-256-GCM di tiap entri.',
  'Row-level security mengisolasi tiap akun di database.',
  'Nggak ada reset password — karena cuma kamu yang bisa dekripsi.',
];

const SPECS = [
  { value: 'AES-256', label: 'Enkripsi GCM terautentikasi' },
  { value: '600k', label: 'Putaran PBKDF2 per kunci' },
  { value: '4 tipe', label: 'Login · kartu · catatan · identitas' },
  { value: '0', label: 'Pelacak & data dikumpulkan' },
];

const FAQS = [
  { q: 'Apakah benar-benar aman?', a: 'Ya. Semua dienkripsi di perangkat kamu dengan AES-256-GCM sebelum dikirim. Server cuma menyimpan ciphertext yang teracak — bahkan kami nggak bisa membacanya.' },
  { q: 'Gimana kalau saya lupa master password?', a: 'Master password adalah satu-satunya kunci dan nggak pernah disimpan. Kalau lupa, datanya nggak bisa dipulihkan — jadi catat baik-baik. Ini konsekuensi wajar dari keamanan zero-knowledge.' },
  { q: 'Bisa dipakai di HP?', a: 'Bisa. Buka di browser HP, atau install sebagai aplikasi (PWA) buat akses layar penuh & offline. Buka pakai sidik jari atau wajah juga didukung.' },
  { q: 'Bisa pindah dari Chrome atau manager lain?', a: 'Bisa. Ekspor password kamu ke CSV dari sana, lalu impor di myVault — kolomnya dikenali otomatis. Kamu juga bisa ekspor balik kapan pun.' },
  { q: 'Selain password, apa lagi yang bisa disimpan?', a: 'Kartu kredit, catatan aman, dan identitas (KTP/paspor) — plus kode 2FA/TOTP yang berputar otomatis di tiap akun, jadi nggak perlu app authenticator terpisah.' },
];

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
