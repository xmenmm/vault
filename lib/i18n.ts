'use client';

// Tiny language store for the public surfaces (landing + login). Persists the
// choice to localStorage and syncs it across components/tabs via events.
import { useEffect, useState } from 'react';

export type Lang = 'id' | 'en';

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'id';
  try {
    return localStorage.getItem('vault-lang') === 'en' ? 'en' : 'id';
  } catch {
    return 'id';
  }
}

export function setStoredLang(l: Lang) {
  try {
    localStorage.setItem('vault-lang', l);
    window.dispatchEvent(new Event('vault-langchange'));
  } catch {
    /* ignore */
  }
}

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>('id');
  useEffect(() => {
    setLang(getLang());
    const sync = () => setLang(getLang());
    window.addEventListener('vault-langchange', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('vault-langchange', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const set = (l: Lang) => {
    setStoredLang(l);
    setLang(l);
  };
  return [lang, set];
}
