import './globals.css';
import type { Metadata } from 'next';
import { VaultProvider } from './providers';

export const metadata: Metadata = {
  title: 'myVault — brankas password terenkripsi',
  description: 'Password kamu, terenkripsi di perangkat kamu.',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'myVault' },
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#05070c' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <VaultProvider>{children}</VaultProvider>
      </body>
    </html>
  );
}
