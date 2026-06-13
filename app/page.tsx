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
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 sm:px-8 h-16">
          <div className="font-extrabold text-lg tracking-tight">
            🔐 my<span className="text-[#5b8cff]">Vault</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-neutral-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how" className="hover:text-white transition">How it works</a>
            <a href="#security" className="hover:text-white transition">Security</a>
          </nav>
          <Link
            href="/login"
            className="text-sm font-semibold rounded-full bg-white text-black px-4 py-2 hover:bg-neutral-200 transition"
          >
            Open vault
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-12 md:pt-20 pb-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[#9db4ff] bg-[#5b8cff]/10 border border-[#5b8cff]/25 rounded-full px-3 py-1">
              <LockIcon className="w-3.5 h-3.5" /> ZERO-KNOWLEDGE ENCRYPTION
            </span>
            <h1 className="mt-5 text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Your passwords,
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7aa2ff] to-[#a78bff]">
                encrypted end to end.
              </span>
            </h1>
            <p className="mt-5 text-neutral-300 text-lg max-w-lg leading-relaxed">
              One vault for every login — Facebook, Gmail, anything. Locked with a
              master password only you know. Not the server, not us, not anyone can
              read it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-white text-black font-semibold px-6 py-3.5 hover:bg-neutral-200 transition"
              >
                Create your vault →
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/15 px-6 py-3.5 font-semibold hover:bg-white/5 transition"
              >
                I already have one
              </Link>
            </div>
            <div className="mt-7 flex items-center gap-5 text-sm text-neutral-400">
              <span className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#2bb079]" /> AES-256-GCM</span>
              <span className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#2bb079]" /> Works on phone</span>
              <span className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#2bb079]" /> No tracking</span>
            </div>
          </div>

          <div className="relative h-[360px] md:h-[460px]">
            <SplineScene
              scene="/robot.splinecode"
              className="!absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative mx-auto max-w-6xl px-5 sm:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center">Built like a bank vault.</h2>
        <p className="mt-3 text-neutral-400 text-center max-w-xl mx-auto">
          Everything is encrypted on your device before it ever leaves. Here&apos;s what
          you get.
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
      <section id="how" className="relative mx-auto max-w-6xl px-5 sm:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center">Up and running in a minute.</h2>
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
      <section id="security" className="relative mx-auto max-w-6xl px-5 sm:px-8 py-16">
        <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-[#0b1020] to-[#0a0a14] p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Even <span className="text-[#5b8cff]">we</span> can&apos;t read it.
            </h2>
            <p className="mt-4 text-neutral-300 leading-relaxed">
              Your master password is turned into an encryption key inside your browser
              with 600,000 rounds of PBKDF2 — and it never leaves your device. The
              server only ever stores scrambled ciphertext.
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
            <div className="text-neutral-500">// what the server actually stores</div>
            <div className="mt-2 text-[#2bb079]">title:</div>
            <div className="text-neutral-300 break-all">3a9f:c1d4e7…a8b2 ❌ unreadable</div>
            <div className="mt-2 text-[#2bb079]">password:</div>
            <div className="text-neutral-300 break-all">7f20:9e0c11…4d6f ❌ unreadable</div>
            <div className="mt-4 text-neutral-500">// only your master password decrypts it</div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-bold">Take back your passwords.</h2>
        <p className="mt-4 text-neutral-400 max-w-md mx-auto">
          Free, encrypted, and yours. Set a master password and start in seconds.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-full bg-white text-black font-semibold px-8 py-4 hover:bg-neutral-200 transition"
        >
          Create your vault →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/5">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-neutral-500">
          <div className="font-extrabold text-white">
            🔐 my<span className="text-[#5b8cff]">Vault</span>
          </div>
          <div>Encrypted on your device · You hold the only key</div>
        </div>
      </footer>
    </main>
  );
}

/* ── data ── */
const FEATURES = [
  { icon: <ShieldIcon />, title: 'Zero-knowledge', desc: 'Encrypted in your browser. The server never sees a plaintext password.' },
  { icon: <KeyIcon />, title: 'One master password', desc: 'A single key unlocks everything. Strong by design, never stored or sent.' },
  { icon: <PhoneIcon />, title: 'Any device', desc: 'Open your vault from laptop or phone — your data decrypts locally.' },
  { icon: <DiceIcon />, title: 'Password generator', desc: 'Create long, random, unique passwords for every account in one tap.' },
  { icon: <TimerIcon />, title: 'Auto-lock', desc: 'Locks itself after idle and wipes the key from memory. Clipboard auto-clears.' },
  { icon: <SearchIcon />, title: 'Instant search', desc: 'Find any login fast, organized by your own categories.' },
];

const STEPS = [
  { title: 'Set a master password', desc: 'Pick one strong password you’ll remember. It becomes your encryption key.' },
  { title: 'Add your logins', desc: 'Save Facebook, Gmail, banking — anything — with the built-in generator.' },
  { title: 'Access anywhere', desc: 'Deploy once, then unlock from any device. Everything decrypts on the spot.' },
];

const SECURITY = [
  'Master password never transmitted — only a one-way auth hash is.',
  'AES-256-GCM authenticated encryption per entry.',
  'Row-level security isolates every account in the database.',
  'No password reset — because no one but you can decrypt it.',
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
