// Brand mark: a security shield with a keyhole on a blue→purple gradient, as
// inline SVG so it stays crisp at any size. Pure markup (no hooks), usable in
// server or client components. Decorative — the adjacent "myVault" text is the
// accessible name.
const SHIELD =
  'M50 5 C58 11 69 15 80 16 C84 16 86 18 86 22 V47 ' +
  'C86 70 71 87 50 95 C29 87 14 70 14 47 V22 ' +
  'C14 18 16 16 20 16 C31 15 42 11 50 5 Z';

export function BrandMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="mv-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6f9bff" />
          <stop offset="46%" stopColor="#5b8cff" />
          <stop offset="100%" stopColor="#7c5cff" />
        </linearGradient>
        <radialGradient id="mv-logo-sheen" cx="32%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.40" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* shield */}
      <path d={SHIELD} fill="url(#mv-logo-g)" />
      <path d={SHIELD} fill="url(#mv-logo-sheen)" />
      {/* inner hairline for depth */}
      <path d={SHIELD} fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="2" transform="translate(50 49) scale(0.84) translate(-50 -49)" />
      {/* keyhole */}
      <circle cx="50" cy="43" r="7.5" fill="#ffffff" />
      <path d="M50 44 L45 62 H55 Z" fill="#ffffff" />
    </svg>
  );
}

// Mark + "myVault" wordmark. `accent` colors the "Vault" half to match each
// surface's theme.
export function Logo({ size = 24, accent = '#7aa2ff', className }: { size?: number; accent?: string; className?: string }) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <BrandMark size={size} />
      <span>my<span style={{ color: accent }}>Vault</span></span>
    </span>
  );
}
