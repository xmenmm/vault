'use client';

import { useEffect } from 'react';
import { useAppT } from '@/lib/app-i18n';
import { BrandMark } from '@/components/Logo';

// A printable "emergency kit" recovery sheet. Zero-knowledge: the master password
// is NEVER printed — there's a blank line to write it by hand. We only prefill the
// non-secret facts (URL, email, date); secrets stay blank for the user to fill.
export function EmergencyKit({ onClose }: { onClose: () => void }) {
  const t = useAppT();
  const email = (typeof localStorage !== 'undefined' && localStorage.getItem('vault-email')) || '—';
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const date = new Date().toLocaleDateString(t.localeTag, { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal ekit-modal" role="dialog" aria-modal="true" aria-labelledby="ekit-title">
        <div className="ekit-sheet">
          <div className="ekit-head">
            <BrandMark size={40} />
            <div>
              <h2 id="ekit-title" className="ekit-title">myVault — {t.ekTitle}</h2>
              <p className="ekit-date">{t.ekGenerated} {date}</p>
            </div>
          </div>

          <p className="ekit-warn">⚠️ {t.ekStoreSafe}</p>

          <div className="ekit-fields">
            <div className="ekit-row"><span className="ekit-lbl">{t.ekUrl}</span><b className="ekit-val">{url}</b></div>
            <div className="ekit-row"><span className="ekit-lbl">{t.ekEmail}</span><b className="ekit-val">{email}</b></div>
            <div className="ekit-row"><span className="ekit-lbl">{t.ekMasterPw}</span><span className="ekit-blank" /></div>
            <p className="ekit-sub">{t.ekHandwrite}</p>
          </div>

          <p className="ekit-crit">🔑 {t.ekCritical}</p>

          <div className="ekit-recovery">
            <p className="ekit-sec-title">{t.ekRecoveryTitle}</p>
            <div className="ekit-codes">
              {Array.from({ length: 8 }).map((_, i) => (
                <div className="ekit-code-line" key={i}><span>{i + 1}.</span><span className="ekit-blank" /></div>
              ))}
            </div>
          </div>

          <div className="ekit-how">
            <p className="ekit-sec-title">{t.ekHowTitle}</p>
            <ol>
              <li>{t.ekHow1}</li>
              <li>{t.ekHow2}</li>
              <li>{t.ekHow3}</li>
            </ol>
          </div>
        </div>

        <div className="modal-acts ekit-acts">
          <button type="button" className="btn ghost" onClick={onClose}>{t.ekClose}</button>
          <button type="button" className="btn" onClick={() => window.print()}>🖨 {t.ekPrint}</button>
        </div>
      </div>
    </div>
  );
}
