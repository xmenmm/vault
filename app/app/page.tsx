'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVault } from '@/app/providers';
import Vault from '@/components/Vault';

export default function AppPage() {
  const { keys, lock, restoring } = useVault();
  const router = useRouter();

  // Wait for the cached session to restore before deciding to redirect.
  useEffect(() => {
    if (!restoring && !keys) router.replace('/login');
  }, [restoring, keys, router]);

  if (restoring || !keys) return null;

  return (
    <Vault
      keys={keys}
      onLock={() => {
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        lock();
        router.push('/');
      }}
    />
  );
}
