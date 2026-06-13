import './globals.css';
import type { Metadata } from 'next';
import { VaultProvider } from './providers';

export const metadata: Metadata = {
  title: 'Vault — encrypted password manager',
  description: 'Your passwords, encrypted on your device.',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <VaultProvider>{children}</VaultProvider>
      </body>
    </html>
  );
}
