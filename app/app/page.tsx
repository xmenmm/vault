'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVault } from '@/app/providers';
import Vault from '@/components/Vault';

export default function AppPage() {
  const { keys, lock } = useVault();
  const router = useRouter();

  // No key in memory (refresh / not unlocked) → back to login.
  useEffect(() => {
    if (!keys) router.replace('/login');
  }, [keys, router]);

  if (!keys) return null;

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
