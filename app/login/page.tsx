'use client';

import { useRouter } from 'next/navigation';
import Lock from '@/components/Lock';
import { useVault } from '@/app/providers';

export default function LoginPage() {
  const router = useRouter();
  const { setKeys } = useVault();
  return (
    <Lock
      onUnlock={(k) => {
        setKeys(k);
        router.push('/app');
      }}
    />
  );
}
