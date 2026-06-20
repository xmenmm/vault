import Link from 'next/link';
import { SplineScene } from '@/components/ui/splite';

export default function Landing() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#05070c] text-white">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-[#5b8cff]/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-[40%] -right-40 h-[420px] w-[420px] rounded-full bg-[#7c5cff]/20 blur-[120px]" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#05070c]/70 border-b border-white/5">
        <div className="w-full flex items-center justify-between px-6 sm:px-12 lg:px-20 h-16">
          <div className="font-extrabold text-lg tracking-tight">
            🔐 my<span className="text-[#5b8cff]">Vault</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-neutral-300">
            <a href="#features" className="hover:text-white transition">Fitur</a>
            <a href="#how" className="hover:text-white transition">Cara kerja</a>
            <a href="#security" className="hover:text-white transition">Keamanan</a>
          </nav>
          <Link
            href="/login"
            className="text-sm font-semibold rounded-full bg-white text-black px-4 py-2 hover:bg-neutral-200 transition"
          >
            Buka brankas
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative w-full px-6 sm:px-12 lg:px-20 pt-12 md:pt-20 pb-16">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[#9db4ff] bg-[#5b8cff]/10 border border-[#5b8cff]/25 rounded-full px-3 py-1">
              <LockIcon className="w-3.5 h-3.5" /> ENKRIPSI ZERO-KNOWLEDGE
            </span>
            <h1 className="mt-5 text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Password kamu,
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7aa2ff] to-[#a78bff]">
                terenkripsi penuh.
              </span>
            </h1>
            <p className="mt-5 text-neutral-300 text-lg max-w-lg leading-relaxed">
              Satu brankas buat semua login — Facebook, Gmail, apa pun. Dikunci pakai
              master password yang cuma kamu tahu. Server, kami, siapa pun — nggak ada
              yang bisa baca.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-white text-black font-semibold px-6 py-3.5 hover:bg-neutral-200 transition"
              >
                Buka brankas kamu →
              </Link>
            </div>
            <div className="mt-7 flex items-center gap-5 text-sm text-neutral-400">
              <span className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#2bb079]" /> AES-256-GCM</span>
              <span className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#2bb079]" /> Jalan di HP</span>
              <span className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#2bb079]" /> Tanpa pelacakan</span>
            </div>
          </div>

          <div className="relative h-[440px] md:h-[600px] lg:h-[720px]">
            <SplineScene
              scene="/robot.splinecode"
              className="!absolute inset-0 h-full w-full scale-110 lg:scale-125"
            />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative w-full px-6 sm:px-12 lg:px-20 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center">Dibangun kayak brankas bank.</h2>
        <p className="mt-3 text-neutral-400 text-center max-w-xl mx-auto">
          Semua dienkripsi di perangkat kamu sebelum keluar. Ini yang kamu dapat.
        </p>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/8 bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-[#5b8cff]/30 transition"
            >
              <div className="w-11 h-11 rounded-xl bg-[#5b8cff]/12 border border-[#5b8cff]/20 grid place-items-center text-[#7aa2ff] group-hover:scale-105 transition">
                {f.icon}
              </div>
              <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
              <p className="mt-1.5 text-neutral-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="relative w-full px-6 sm:px-12 lg:px-20 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center">Siap pakai dalam semenit.</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-white/8 bg-white/[0.02] p-7">
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-[#5b8cff] to-[#5b8cff]/20">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-3 font-semibold text-lg">{s.title}</h3>
              <p className="mt-1.5 text-neutral-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Security band ── */}
      <section id="security" className="relative w-full px-6 sm:px-12 lg:px-20 py-16">
        <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-[#0b1020] to-[#0a0a14] p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Bahkan <span className="text-[#5b8cff]">kami</span> nggak bisa baca.
            </h2>
            <p className="mt-4 text-neutral-300 leading-relaxed">
              Master password kamu diubah jadi kunci enkripsi di dalam browser dengan
              600.000 putaran PBKDF2 — dan nggak pernah keluar dari perangkat kamu.
              Server cuma menyimpan ciphertext yang teracak.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {SECURITY.map((s) => (
                <li key={s} className="flex items-start gap-3 text-neutral-300">
                  <CheckIcon className="w-5 h-5 text-[#2bb079] flex-none mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/40 p-5 font-mono text-[13px] leading-relaxed overflow-hidden">
            <div className="text-neutral-500">// yang sebenarnya disimpan server</div>
            <div className="mt-2 text-[#2bb079]">judul:</div>
            <div className="text-neutral-300 break-all">3a9f:c1d4e7…a8b2 ❌ nggak terbaca</div>
            <div className="mt-2 text-[#2bb079]">password:</div>
            <div className="text-neutral-300 break-all">7f20:9e0c11…4d6f ❌ nggak terbaca</div>
            <div className="mt-4 text-neutral-500">// cuma master password kamu yang bisa dekripsi</div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative w-full px-6 sm:px-12 lg:px-20 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-bold">Ambil alih password kamu.</h2>
        <p className="mt-4 text-neutral-400 max-w-md mx-auto">
          Terenkripsi, dan milik kamu sepenuhnya. Buka pakai master password, langsung masuk.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-full bg-white text-black font-semibold px-8 py-4 hover:bg-neutral-200 transition"
        >
          Buka brankas kamu →
        </Link>
      </section>

      {/* ── Logo cloud (marquee) ── */}
      <section className="relative w-full px-6 sm:px-12 lg:px-20 pb-24 pt-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center">Satu brankas buat semua akunmu.</h2>
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
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/5">
        <div className="w-full px-6 sm:px-12 lg:px-20 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-neutral-500">
          <div className="font-extrabold text-white">
            🔐 my<span className="text-[#5b8cff]">Vault</span>
          </div>
          <div>Dienkripsi di perangkat kamu · Cuma kamu yang pegang kuncinya</div>
        </div>
      </footer>
    </main>
  );
}

/* ── data ── */
const FEATURES = [
  { icon: <ShieldIcon />, title: 'Zero-knowledge', desc: 'Dienkripsi di browser kamu. Server nggak pernah lihat password asli.' },
  { icon: <KeyIcon />, title: 'Satu master password', desc: 'Satu kunci buka semuanya. Kuat by design, nggak pernah disimpan atau dikirim.' },
  { icon: <PhoneIcon />, title: 'Semua perangkat', desc: 'Buka brankas dari laptop atau HP — datanya didekripsi lokal.' },
  { icon: <DiceIcon />, title: 'Generator password', desc: 'Bikin password panjang, acak, dan unik buat tiap akun sekali klik.' },
  { icon: <TimerIcon />, title: 'Kunci otomatis', desc: 'Mengunci sendiri saat idle & hapus kunci dari memori. Clipboard auto-bersih.' },
  { icon: <SearchIcon />, title: 'Pencarian instan', desc: 'Temukan login mana pun dengan cepat, terorganisir per kategori kamu.' },
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
function KeyIcon() { return <Base><circle cx="7.5" cy="15.5" r="4.5" /><path d="m11 12 8-8 3 3M16 7l2 2" /></Base>; }
function PhoneIcon() { return <Base><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></Base>; }
function DiceIcon() { return <Base><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1" fill="currentColor" /><circle cx="15.5" cy="15.5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /></Base>; }
function TimerIcon() { return <Base><circle cx="12" cy="13" r="8" /><path d="M12 13V9M9 2h6" /></Base>; }
function SearchIcon() { return <Base><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Base>; }
function CheckIcon({ className }: { className?: string }) { return <Base className={className}><path d="m20 6-11 11-5-5" /></Base>; }
