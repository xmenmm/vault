'use client';

import { useState } from 'react';
import { deriveKeys, encryptStr, decryptStr, type Keys } from '@/lib/crypto';
import { strength } from '@/lib/strength';
import { biometricEnabled, disableBiometric } from '@/lib/webauthn';
import { useVault } from '@/app/providers';
import { useAppT } from '@/lib/app-i18n';

// Settings → Security → "Change master password". Re-encrypts every item with a
// key derived from the new password, then rotates the auth — all without the
// server ever seeing plaintext or either key.
export function ChangePassword({ currentKeys, flash }: { currentKeys: Keys; flash: (m: string) => void }) {
  const t = useAppT();
  const { setKeys } = useVault();
  const [open, setOpen] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const st = strength(newPw);

  function reset() {
    setOpen(false); setOldPw(''); setNewPw(''); setNewPw2(''); setErr(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr(null);

    if (newPw.length < 8) { setErr(t.cpwTooShort); return; }
    if (newPw !== newPw2) { setErr(t.cpwMismatch); return; }
    if (newPw === oldPw) { setErr(t.cpwSame); return; }

    const email = (localStorage.getItem('vault-email') || '').trim().toLowerCase();
    if (!email) { setErr(t.cpwNoEmail); return; }

    setBusy(true);
    try {
      // Verify the old password locally (fast feedback) when we have the hash.
      const oldKeys = await deriveKeys(email, oldPw);
      if (currentKeys.authHash && oldKeys.authHash !== currentKeys.authHash) {
        setErr(t.cpwWrongOld); setBusy(false); return;
      }
      const newKeys = await deriveKeys(email, newPw);

      // Pull the raw ciphertext, decrypt with the current key, re-encrypt with new.
      const res = await fetch('/api/vault');
      if (!res.ok) { setErr(t.cpwLoadFailed); setBusy(false); return; }
      const { items: rows } = (await res.json()) as { items: { id: string; data: string }[] };
      const reEncrypted: { id: string; data: string }[] = [];
      for (const r of rows ?? []) {
        let pt: string;
        try {
          pt = await decryptStr(currentKeys.encKey, r.data);
        } catch {
          setErr(t.cpwDecryptFailed); setBusy(false); return;
        }
        reEncrypted.push({ id: r.id, data: await encryptStr(newKeys.encKey, pt) });
      }

      const save = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ oldAuthHash: oldKeys.authHash, newAuthHash: newKeys.authHash, items: reEncrypted }),
      });
      if (!save.ok) {
        const d = (await save.json().catch(() => ({}))) as { error?: string };
        if (save.status === 401) setErr(t.cpwWrongOld);
        else if (save.status === 409) setErr(t.cpwOutOfSync);
        else if (save.status === 429) setErr(t.cpwTooMany);
        else setErr(d.error || t.cpwFailed);
        setBusy(false);
        return;
      }

      // Success: switch the live session to the new key, and drop biometric since
      // it wraps the old key.
      setKeys(newKeys);
      let note = t.cpwDone;
      if (biometricEnabled()) { disableBiometric(); note = t.cpwDoneBio; }
      reset();
      flash(note);
    } finally {
      setBusy(false);
    }
  }

  const field = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--panel-2)',
    color: 'var(--text)', fontSize: 14,
  } as const;

  return (
    <div className="tf-kv" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12, padding: '4px 0 12px', borderTop: '1px solid var(--border)' }}>
      <div className="tf-method">
        <span>
          {t.cpwTitle}
          <br />
          <small style={{ color: 'var(--muted)' }}>{t.cpwHint}</small>
        </span>
        {!open && <button className="btn sec sm" onClick={() => setOpen(true)}>{t.cpwBtn}</button>}
      </div>

      {open && (
        <form onSubmit={submit} className="tf-enroll" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input style={field} type="password" autoComplete="current-password" placeholder={t.cpwOld} aria-label={t.cpwOld} value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
          <input style={field} type="password" autoComplete="new-password" placeholder={t.cpwNew} aria-label={t.cpwNew} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          {newPw.length > 0 && (
            <div style={{ display: 'flex', gap: 4 }} aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= st.score - 1 ? st.color : 'var(--border)' }} />
              ))}
            </div>
          )}
          <input style={field} type="password" autoComplete="new-password" placeholder={t.cpwConfirm} aria-label={t.cpwConfirm} value={newPw2} onChange={(e) => setNewPw2(e.target.value)} />

          <p className="pc-desc" style={{ margin: '2px 0 0' }}>⚠️ {t.cpwWarn}</p>
          {err && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{err}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn sec" disabled={busy || !oldPw || !newPw} aria-busy={busy}>
              {busy ? t.cpwWorking : t.cpwConfirmBtn}
            </button>
            <button type="button" className="btn ghost" onClick={reset} disabled={busy}>{t.cpwCancel}</button>
          </div>
        </form>
      )}
    </div>
  );
}
