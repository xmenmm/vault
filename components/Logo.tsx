// Brand mark: a white padlock with a keyhole on a blue→purple gradient badge —
// the same design as the app/PWA icon (lib/app-icon.tsx), as inline SVG so it
// stays crisp at any size. Pure markup (no hooks), usable in server or client
// components. Decorative — the adjacent "myVault" text is the accessible name.
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
        <radialGradient id="mv-logo-sheen" cx="30%" cy="22%" r="62%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="96" height="96" rx="26" fill="url(#mv-logo-g)" />
      <rect x="2" y="2" width="96" height="96" rx="26" fill="url(#mv-logo-sheen)" />
      {/* shackle */}
      <path d="M37 47 V41 a13 13 0 0 1 26 0 V47" stroke="#ffffff" strokeWidth="7" fill="none" strokeLinecap="round" />
      {/* body */}
      <rect x="29" y="46" width="42" height="33" rx="9" fill="#ffffff" />
      {/* keyhole */}
      <circle cx="50" cy="60" r="6.2" fill="#5b8cff" />
      <path d="M50 61 L47.4 72.5 H52.6 Z" fill="#5b8cff" />
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
