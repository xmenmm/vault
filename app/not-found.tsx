'use client';

import Link from 'next/link';
import { useLang } from '@/lib/i18n';

export default function NotFound() {
  const [lang] = useLang();
  const t = lang === 'en'
    ? { code: '404', title: 'Page not found', sub: 'The page you’re looking for doesn’t exist or has moved.', home: 'Back to home', open: 'Open vault' }
    : { code: '404', title: 'Halaman nggak ketemu', sub: 'Halaman yang kamu cari nggak ada atau udah pindah.', home: 'Kembali ke beranda', open: 'Buka brankas' };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#05070c] text-white antialiased flex items-center justify-center px-6">
      <div className="pointer-events-none absolute -top-40 -left-32 h-[440px] w-[440px] rounded-full bg-[#5b8cff]/20 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[440px] w-[440px] rounded-full bg-[#7c5cff]/20 blur-[140px]" />

      <div className="relative text-center">
        <Link href="/" className="inline-block font-extrabold text-lg tracking-tight mb-10">
          🔐 my<span className="text-[#7aa2ff]">Vault</span>
        </Link>
        <div className="bg-clip-text text-transparent bg-gradient-to-r from-[#8fb0ff] via-[#a78bff] to-[#7c5cff] text-[6rem] md:text-[8rem] font-bold leading-none tracking-tight">
          {t.code}
        </div>
        <h1 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="mt-3 text-neutral-400 max-w-sm mx-auto">{t.sub}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-gradient-to-r from-[#5b8cff] to-[#7c5cff] text-white font-semibold px-7 py-3 shadow-[0_10px_34px_-8px_rgba(91,140,255,0.65)] hover:shadow-[0_14px_44px_-6px_rgba(124,92,255,0.75)] transition-all"
          >
            {t.home}
          </Link>
          <Link href="/login" className="rounded-full border border-white/12 px-6 py-3 text-sm font-medium text-neutral-300 hover:bg-white/[0.04] hover:border-white/20 transition">
            {t.open}
          </Link>
        </div>
      </div>
    </main>
  );
}
