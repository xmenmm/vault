'use client';

// Orbital loading animation — social/brand icons orbit a pulsing core while
// the vault decrypts. Pure CSS animation (no JS interval, no 3D libs); brand
// icons from the simple-icons CDN (same as the rest of the app).

const ICONS = [
  'google', 'instagram', 'github', 'facebook', 'x', 'netflix',
  'spotify', 'discord', 'whatsapp', 'tiktok', 'youtube', 'paypal',
];

export function OrbitalLoader({ label = 'Membuka brankas…' }: { label?: string }) {
  const n = ICONS.length;
  return (
    <div className="orbit-wrap">
      <div className="orbit-loader">
        <div className="orbit-ring" />
        <div className="orbit-core">
          <span className="orbit-core-dot" />
        </div>
        <div className="orbit-spin">
          {ICONS.map((slug, i) => {
            const a = (i / n) * 2 * Math.PI;
            const x = Math.round(Math.cos(a) * 132);
            const y = Math.round(Math.sin(a) * 132);
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={slug}
                className="orbit-ico"
                alt=""
                src={`https://cdn.simpleicons.org/${slug}/cbd5e1`}
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
              />
            );
          })}
        </div>
      </div>
      {label && <p className="orbit-label">{label}</p>}
    </div>
  );
}
