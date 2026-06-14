'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { exportEncKey, importEncKey, type Keys } from '@/lib/crypto';

// The encryption key is cached (locally) so a refresh / reopen doesn't force a
// re-login. It still auto-locks after idle and expires after a few days.
const STORE = 'vault-k';
const AUTO_LOCK_MS = 30 * 60 * 1000; // 30 min idle
const PERSIST_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type Ctx = {
  keys: Keys | null;
  setKeys: (k: Keys | null) => void;
  lock: () => void;
  restoring: boolean;
};

const VaultCtx = createContext<Ctx | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [keys, setKeysState] = useState<Keys | null>(null);
  const [restoring, setRestoring] = useState(true);
  const timer = useRef<number | null>(null);

  const persist = useCallback(async (k: Keys | null) => {
    try {
      if (!k) {
        localStorage.removeItem(STORE);
        return;
      }
      const encKeyB64 = await exportEncKey(k.encKey);
      localStorage.setItem(
        STORE,
        JSON.stringify({ encKeyB64, authHash: k.authHash, exp: Date.now() + PERSIST_MS })
      );
    } catch {
      /* ignore */
    }
  }, []);

  const setKeys = useCallback(
    (k: Keys | null) => {
      setKeysState(k);
      persist(k);
    },
    [persist]
  );

  const lock = useCallback(() => {
    setKeysState(null);
    try {
      localStorage.removeItem(STORE);
    } catch {
      /* ignore */
    }
  }, []);

  // Restore a cached session on load.
  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(STORE);
        if (raw) {
          const { encKeyB64, authHash, exp } = JSON.parse(raw);
          if (exp && Date.now() < exp && encKeyB64) {
            const encKey = await importEncKey(encKeyB64);
            setKeysState({ encKey, authHash: authHash || '' });
          } else {
            localStorage.removeItem(STORE);
          }
        }
      } catch {
        /* ignore */
      }
      setRestoring(false);
    })();
  }, []);

  // Idle auto-lock.
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

  return (
    <VaultCtx.Provider value={{ keys, setKeys, lock, restoring }}>{children}</VaultCtx.Provider>
  );
}

export function useVault() {
  const c = useContext(VaultCtx);
  if (!c) throw new Error('useVault must be used within VaultProvider');
  return c;
}
