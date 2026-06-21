'use client';

import { useRef, useState } from 'react';

// A glassy preview of the actual vault, used as the landing/login hero.
// Tilts in 3D toward the mouse (parallax) — pure CSS transforms + a tiny
// mouse handler, no 3D library.

const ITEMS = [
  { slug: 'google', name: 'Google', user: 'kamu@gmail.com' },
  { slug: 'github', name: 'GitHub', user: 'xmenmm' },
  { slug: 'netflix', name: 'Netflix', user: 'kamu@email.com' },
  { slug: 'spotify', name: 'Spotify', user: 'premium-acc' },
];

const REST = { rx: 6, ry: -12 };

export function VaultPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(REST);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height; // 0..1
    setT({
      ry: (px - 0.5) * -24, // cursor →  rotates Y
      rx: (py - 0.5) * 18, // cursor ↓ tilts X
    });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setT(REST)}
      className="flex h-full w-full items-center justify-center"
      style={{ perspective: '1500px' }}
    >
      {/* ambient glows */}
      <div className="pointer-events-none absolute h-[360px] w-[360px] rounded-full bg-[#5b8cff]/25 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-10 right-6 h-56 w-56 rounded-full bg-[#7c5cff]/20 blur-[110px]" />

      <div className="vault-float relative w-[min(440px,94%)]">
        <div
          className="relative"
          style={{
            transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.18s ease-out',
          }}
        >
          {/* main glass card */}
          <div className="relative rounded-[22px] border border-white/12 bg-white/[0.05] p-5 shadow-[0_45px_120px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            {/* top sheen */}
            <div className="pointer-events-none absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

            {/* header */}
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-bold tracking-tight">
                🔐 my<span className="text-[#7aa2ff]">Vault</span>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-[#2bb079]/25 bg-[#2bb079]/12 px-2.5 py-1 text-[11px] font-medium text-[#2bb079]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2bb079]" /> Terenkripsi
              </span>
            </div>

            {/* search */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] text-neutral-500">
              <SearchMini /> Cari login…
            </div>

            {/* items */}
            <div className="mt-3 space-y-2">
              {ITEMS.map((it) => (
                <div
                  key={it.slug}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5"
                >
                  <div className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-[#5b8cff]/25 to-[#7c5cff]/12">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://cdn.simpleicons.org/${it.slug}/cbd5e1`}
                      alt={it.name}
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold leading-tight">{it.name}</div>
                    <div className="truncate text-[12px] text-neutral-500">{it.user}</div>
                  </div>
                  <div className="text-sm tracking-[0.2em] text-neutral-600">••••••</div>
                  <CopyMini />
                </div>
              ))}
            </div>

            {/* footer */}
            <div className="mt-4 flex items-center justify-between text-[12px] text-neutral-500">
              <span>12 login tersimpan</span>
              <span className="text-[#2bb079]">Skor aman 100%</span>
            </div>
          </div>

          {/* floating accent: generator chip — popped forward for depth */}
          <div
            className="absolute -bottom-9 -left-7 hidden rounded-2xl border border-white/12 bg-[#0b0f1a]/85 p-3.5 shadow-2xl backdrop-blur-xl sm:block"
            style={{ transform: 'translateZ(55px)' }}
          >
            <div className="text-[10px] uppercase tracking-wider text-neutral-500">Generator</div>
            <div className="mt-1 font-mono text-[13px] text-[#9db4ff]">qSHeyb…$5x-v</div>
            <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-[#5b8cff] to-[#2bb079]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchMini() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function CopyMini() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none text-[#7aa2ff]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  );
}
