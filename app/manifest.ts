import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'myVault — Brankas Password',
    short_name: 'myVault',
    description: 'Brankas password terenkripsi, zero-knowledge.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#05070c',
    theme_color: '#05070c',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
