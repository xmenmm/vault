'use client';

import { useEffect, useState } from 'react';
import qrcode from 'qrcode-generator';
import { useAppT } from '@/lib/app-i18n';
import { randomBase32Secret, otpauthUri } from '@/lib/twofa-client';

type Mode = 'idle' | 'enroll' | 'recovery' | 'disable';

// The "Two-factor authentication" section inside Settings → Security & Privacy.
// Enrollment generates the secret on-device, shows a QR + manual key, and only
// stores the secret server-side once the user proves a valid code.
export function TwoFactorCard({ flash }: { flash: (m: string) => void }) {
  const t = useAppT();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [secret, setSecret] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/auth/2fa/status')
      .then((r) => r.json())
      .then((d) => setEnabled(!!d.enabled))
      .catch(() => setEnabled(false));
  }, []);

  function startEnroll() {
    const s = randomBase32Secret();
    const email = localStorage.getItem('vault-email') || 'vault';
    const uri = otpauthUri(s, email);
    const qr = qrcode(0, 'M');
    qr.addData(uri);
    qr.make();
    setQrSvg(qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }));
    setSecret(s);
    setCode('');
    setMode('enroll');
  }

  async function confirmEnroll() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret, code }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        flash(res.status === 400 ? t.tfBadCode : d.error || t.tfEnableFailed);
        return;
      }
      setRecovery(d.recovery || []);
      setEnabled(true);
      setMode('recovery');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        flash(res.status === 401 ? t.tfBadCode : d.error || t.tfDisableFailed);
        return;
      }
      setEnabled(false);
      setCode('');
      setMode('idle');
      flash(t.tfDisabled);
    } finally {
      setBusy(false);
    }
  }

  function copyRecovery() {
    navigator.clipboard.writeText(recovery.join('\n')).then(
      () => flash(t.tfRecoveryCopied),
      () => {}
    );
  }

  const codeInput = (onSubmit: () => void, submitLabel: string) => (
    <div className="tf-confirm">
      <input
        className="input"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="123456"
        aria-label={t.tfCodeLabel}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: 2, maxWidth: 140 }}
      />
      <button className="btn sec" onClick={onSubmit} disabled={busy || code.length < 6} aria-busy={busy}>
        {submitLabel}
      </button>
      <button className="btn ghost" onClick={() => { setMode('idle'); setCode(''); }} disabled={busy}>
        {t.tfCancel}
      </button>
    </div>
  );

  return (
    <div className="kv tf-kv" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <span>
          {t.tfTitle}
          <br />
          <small style={{ color: 'var(--muted)' }}>{t.tfHint}</small>
        </span>
        {enabled === null ? (
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>…</span>
        ) : enabled ? (
          mode === 'disable' ? null : (
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: 'var(--ok)', fontWeight: 600, fontSize: 13 }}>{t.tfOn}</span>
              {mode === 'idle' && (
                <button className="btn ghost sm" onClick={() => { setCode(''); setMode('disable'); }}>
                  {t.tfDisable}
                </button>
              )}
            </span>
          )
        ) : (
          mode === 'idle' && (
            <button className="btn sec" onClick={startEnroll}>{t.tfEnable}</button>
          )
        )}
      </div>

      {mode === 'enroll' && (
        <div className="tf-enroll" style={{ width: '100%' }}>
          <ol className="tf-steps">
            <li>{t.tfStep1}</li>
            <li>{t.tfStep2}</li>
            <li>{t.tfStep3}</li>
          </ol>
          <div className="tf-qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <div className="tf-secret">
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>{t.tfManualKey}</span>
            <code className="tf-key">{secret}</code>
          </div>
          {codeInput(confirmEnroll, t.tfVerifyEnable)}
        </div>
      )}

      {mode === 'disable' && (
        <div style={{ width: '100%' }}>
          <p className="pc-desc" style={{ marginTop: 0 }}>{t.tfDisablePrompt}</p>
          {codeInput(confirmDisable, t.tfConfirmDisable)}
        </div>
      )}

      {mode === 'recovery' && (
        <div className="tf-recovery" style={{ width: '100%' }}>
          <p className="pc-desc" style={{ marginTop: 0 }}>{t.tfRecoveryIntro}</p>
          <div className="tf-codes">
            {recovery.map((c) => (
              <code key={c}>{c}</code>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn sec" onClick={copyRecovery}>{t.tfCopyCodes}</button>
            <button className="btn ghost" onClick={() => setMode('idle')}>{t.tfDone}</button>
          </div>
        </div>
      )}
    </div>
  );
}
