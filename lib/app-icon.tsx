import { ImageResponse } from 'next/og';

// A simple padlock on a blue→purple gradient, drawn with divs (satori-safe).
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
          background: 'linear-gradient(135deg, #5b8cff, #7c5cff)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: S * 0.3,
              height: S * 0.2,
              border: `${Math.round(S * 0.05)}px solid white`,
              borderBottom: 'none',
              borderTopLeftRadius: S * 0.16,
              borderTopRightRadius: S * 0.16,
            }}
          />
          <div style={{ width: S * 0.46, height: S * 0.34, background: 'white', borderRadius: S * 0.06 }} />
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
