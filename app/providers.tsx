'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Keys } from '@/lib/crypto';

// Holds the in-memory encryption key across client-side route changes
// (landing → login → dashboard). Wiped on lock / idle / full refresh.
type Ctx = { keys: Keys | null; setKeys: (k: Keys | null) => void; lock: () => void };

const VaultCtx = createContext<Ctx | null>(null);
const AUTO_LOCK_MS = 10 * 60 * 1000;

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [keys, setKeys] = useState<Keys | null>(null);
  const lock = useCallback(() => setKeys(null), []);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!keys) return;
    const reset = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(lock, AUTO_LOCK_MS);
    };
    const evs = ['mousemove', 'keydown', 'click', 'touchstart'];
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      evs.forEach((e) => window.removeEventListener(e, reset));
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [keys, lock]);

  return <VaultCtx.Provider value={{ keys, setKeys, lock }}>{children}</VaultCtx.Provider>;
}

export function useVault() {
  const c = useContext(VaultCtx);
  if (!c) throw new Error('useVault must be used within VaultProvider');
  return c;
}
