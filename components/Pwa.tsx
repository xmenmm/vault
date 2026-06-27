'use client';

// Registers the service worker and captures the "install app" prompt so the
// Settings screen can offer a one-tap install. Renders nothing.

import { useEffect } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function getInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function clearInstallPrompt() {
  deferredPrompt = null;
}

export function Pwa() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault(); // stop Chrome's mini-infobar; we surface our own button
      deferredPrompt = e as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event('pwa-installable'));
    };
    const onInstalled = () => {
      deferredPrompt = null;
      window.dispatchEvent(new Event('pwa-installed'));
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  return null;
}
