'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Lock from '@/components/Lock';
import { useVault } from '@/app/providers';

export default function LoginPage() {
  const router = useRouter();
  const { keys, setKeys, restoring } = useVault();

  // Already unlocked (restored cached session) → skip straight to the app.
  useEffect(() => {
    if (!restoring && keys) router.replace('/app');
  }, [restoring, keys, router]);

  if (restoring || keys) return null;

  return (
    <Lock
      onUnlock={(k) => {
        setKeys(k);
        router.push('/app');
      }}
    />
  );
}
