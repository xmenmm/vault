import './globals.css';
import type { Metadata } from 'next';
import { VaultProvider } from './providers';
import { Pwa } from '@/components/Pwa';

const title = 'myVault — brankas password terenkripsi';
const description = 'Brankas password zero-knowledge — terenkripsi di perangkat kamu dengan AES-256-GCM. Cuma kamu yang pegang kuncinya.';

export const metadata: Metadata = {
  metadataBase: new URL('https://vault-xi-beryl.vercel.app'),
  title,
  description,
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'myVault' },
  // Modern equivalent of apple-mobile-web-app-capable (Chrome deprecation notice).
  other: { 'mobile-web-app-capable': 'yes' },
  openGraph: {
    title,
    description,
    siteName: 'myVault',
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#05070c' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Pwa />
        <VaultProvider>{children}</VaultProvider>
      </body>
    </html>
  );
}
