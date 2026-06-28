import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'myVault — zero-knowledge password vault';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Social share banner (WhatsApp / X / Facebook link previews). Div-only so it
// renders without loading a custom font for the lock; the wordmark uses the
// default weight.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#05070c',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', position: 'absolute', top: -190, left: -160, width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,140,255,0.38), rgba(91,140,255,0))' }} />
        <div style={{ display: 'flex', position: 'absolute', bottom: -210, right: -150, width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,255,0.32), rgba(124,92,255,0))' }} />

        {/* lock badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 156,
            height: 156,
            borderRadius: 38,
            background: 'linear-gradient(145deg, #6f9bff, #7c5cff)',
            boxShadow: '0 36px 90px -22px rgba(91,140,255,0.65)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', width: 48, height: 38, border: '9px solid #fff', borderBottom: 'none', borderTopLeftRadius: 27, borderTopRightRadius: 27, marginBottom: -7 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 58, background: '#fff', borderRadius: 17 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', width: 18, height: 18, borderRadius: '50%', background: '#5b8cff' }} />
                <div style={{ display: 'flex', width: 8, height: 16, marginTop: -2, borderRadius: 3, background: '#5b8cff' }} />
              </div>
            </div>
          </div>
        </div>

        {/* wordmark */}
        <div style={{ display: 'flex', marginTop: 44, fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>
          <span style={{ color: '#ffffff' }}>my</span>
          <span style={{ color: '#9db4ff' }}>Vault</span>
        </div>
        <div style={{ display: 'flex', marginTop: 14, fontSize: 34, color: '#aab3c5' }}>Zero-knowledge password vault</div>
        <div style={{ display: 'flex', marginTop: 30, fontSize: 23, color: '#7f8aa0', letterSpacing: 1 }}>
          AES-256-GCM   ·   Encrypted on your device   ·   Works on mobile
        </div>
      </div>
    ),
    { ...size }
  );
}
