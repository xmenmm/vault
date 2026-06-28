import { ImageResponse } from 'next/og';

// Premium app icon: a padlock with a keyhole on a glossy blue→purple gradient.
// Drawn with divs only (satori-safe — no SVG paths). One source for the
// favicon, the 192/512 PWA/maskable icons, and the Apple touch icon.
export function lockIcon(size: number) {
  const S = size;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: 'linear-gradient(145deg, #6f9bff 0%, #5b8cff 46%, #7c5cff 100%)',
        }}
      >
        {/* glossy sheen, top-left */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: -S * 0.18,
            left: -S * 0.18,
            width: S * 0.82,
            height: S * 0.82,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.30), rgba(255,255,255,0))',
          }}
        />

        {/* lock */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: S * 0.03 }}>
          {/* shackle */}
          <div
            style={{
              display: 'flex',
              width: S * 0.3,
              height: S * 0.24,
              border: `${Math.round(S * 0.056)}px solid #ffffff`,
              borderBottom: 'none',
              borderTopLeftRadius: S * 0.17,
              borderTopRightRadius: S * 0.17,
              marginBottom: -S * 0.045,
            }}
          />
          {/* body */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: S * 0.5,
              height: S * 0.37,
              background: '#ffffff',
              borderRadius: S * 0.11,
              boxShadow: `0 ${S * 0.025}px ${S * 0.07}px rgba(20,28,80,0.25)`,
            }}
          >
            {/* keyhole */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', width: S * 0.115, height: S * 0.115, borderRadius: '50%', background: '#5b8cff' }} />
              <div style={{ display: 'flex', width: S * 0.05, height: S * 0.1, marginTop: -S * 0.012, borderRadius: S * 0.02, background: '#5b8cff' }} />
            </div>
          </div>
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
