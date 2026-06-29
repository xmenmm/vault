'use client';

import { useEffect, useState } from 'react';
import qrcode from 'qrcode-generator';
import { useAppT } from '@/lib/app-i18n';
import { randomBase32Secret, otpauthUri } from '@/lib/twofa-client';

type Mode = 'idle' | 'enroll-totp' | 'enroll-wa-phone' | 'enroll-wa-code' | 'recovery' | 'disable';
type Status = {
  methods: { totp: boolean; whatsapp: boolean };
  waPhoneMasked: string | null;
  waAvailable: boolean;
};

// Settings → Security → "Two-step verification". Supports an authenticator app
// (TOTP) and/or WhatsApp OTP. Enrollment generates/confirms on-device; secrets
// reach the server only after a code is proven.
export function TwoFactorCard({ flash }: { flash: (m: string) => void }) {
  const t = useAppT();
  const [status, setStatus] = useState<Status | null>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [secret, setSecret] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const r = await fetch('/api/auth/2fa/status');
      const d = await r.json();
      setStatus({
        methods: d.methods ?? { totp: false, whatsapp: false },
        waPhoneMasked: d.waPhoneMasked ?? null,
        waAvailable: !!d.waAvailable,
      });
    } catch {
      setStatus({ methods: { totp: false, whatsapp: false }, waPhoneMasked: null, waAvailable: false });
    }
  }
  useEffect(() => { refresh(); }, []);

  const enabled = !!status && (status.methods.totp || status.methods.whatsapp);

  function reset() { setMode('idle'); setCode(''); setSecret(''); setPhone(''); }

  // ── TOTP ──
  function startTotp() {
    const s = randomBase32Secret();
    const email = localStorage.getItem('vault-email') || 'vault';
    const qr = qrcode(0, 'M');
    qr.addData(otpauthUri(s, email));
    qr.make();
    setQrSvg(qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }));
    setSecret(s);
    setCode('');
    setMode('enroll-totp');
  }
  async function confirmTotp() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret, code }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { flash(res.status === 400 ? t.tfBadCode : d.error || t.tfEnableFailed); return; }
      await refresh();
      finishRecovery(d.recovery);
    } finally { setBusy(false); }
  }

  // ── WhatsApp ──
  async function sendWaEnroll() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/auth/2fa/wa/start', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { flash(waError(res.status, d.error)); return; }
      setCode('');
      setMode('enroll-wa-code');
      flash(t.tfWaSent);
    } finally { setBusy(false); }
  }
  async function confirmWa() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/auth/2fa/wa/confirm', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { flash(res.status === 400 ? t.tfBadCode : d.error || t.tfEnableFailed); return; }
      await refresh();
      finishRecovery(d.recovery);
    } finally { setBusy(false); }
  }

  // ── disable ──
  async function confirmDisable() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { flash(res.status === 401 ? t.tfBadCode : d.error || t.tfDisableFailed); return; }
      await refresh();
      reset();
      flash(t.tfDisabled);
    } finally { setBusy(false); }
  }

  function finishRecovery(codes: string[] | null | undefined) {
    if (codes && codes.length) { setRecovery(codes); setMode('recovery'); }
    else reset();
  }
  function waError(http: number, err?: string): string {
    if (http === 503) return t.tfWaNotConfigured;
    if (http === 502) return t.tfSendFailed;
    if (http === 429) return t.tfCooldown;
    if (err === 'bad phone') return t.tfWaBadPhone;
    return t.tfEnableFailed;
  }
  function copyRecovery() {
    navigator.clipboard.writeText(recovery.join('\n')).then(() => flash(t.tfRecoveryCopied), () => {});
  }

  const codeInput = (onSubmit: () => void, submitLabel: string) => (
    <div className="tf-confirm">
      <input
        className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
        placeholder="123456" aria-label={t.tfCodeLabel}
        value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: 2, maxWidth: 140 }}
      />
      <button className="btn sec" onClick={onSubmit} disabled={busy || code.length < 6} aria-busy={busy}>{submitLabel}</button>
      <button className="btn ghost" onClick={reset} disabled={busy}>{t.tfCancel}</button>
    </div>
  );

  return (
    <div className="tf-kv" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12, padding: '4px 0 12px' }}>
      <div>
        <span>{t.tfTitle}</span>
        <br />
        <small style={{ color: 'var(--muted)' }}>{t.tfHint}</small>
      </div>

      {status === null ? (
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>…</span>
      ) : (
        <>
          <div className="tf-method">
            <span>{t.tfMethodAuth}</span>
            {status.methods.totp ? (
              <span style={{ color: 'var(--ok)', fontWeight: 600, fontSize: 13 }}>{t.tfOn}</span>
            ) : (
              mode === 'idle' && <button className="btn sec sm" onClick={startTotp}>{t.tfEnable}</button>
            )}
          </div>

          {(status.waAvailable || status.methods.whatsapp) && (
            <div className="tf-method">
              <span>
                {t.tfMethodWa}
                {status.methods.whatsapp && status.waPhoneMasked ? ` (${status.waPhoneMasked})` : ''}
              </span>
              {status.methods.whatsapp ? (
                <span style={{ color: 'var(--ok)', fontWeight: 600, fontSize: 13 }}>{t.tfOn}</span>
              ) : (
                mode === 'idle' && <button className="btn sec sm" onClick={() => { setPhone(''); setMode('enroll-wa-phone'); }}>{t.tfEnable}</button>
              )}
            </div>
          )}

          {enabled && mode === 'idle' && (
            <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setCode(''); setMode('disable'); }}>
              {t.tfDisable}
            </button>
          )}
        </>
      )}

      {mode === 'enroll-totp' && (
        <div className="tf-enroll">
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
          {codeInput(confirmTotp, t.tfVerifyEnable)}
        </div>
      )}

      {mode === 'enroll-wa-phone' && (
        <div className="tf-enroll">
          <p className="pc-desc" style={{ marginTop: 0 }}>{t.tfWaPhoneHint}</p>
          <div className="tf-confirm">
            <input
              className="input" type="tel" inputMode="tel" placeholder="628123456789"
              aria-label={t.tfWaPhoneLabel} value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
              style={{ maxWidth: 200, fontFamily: 'ui-monospace, monospace' }}
            />
            <button className="btn sec" onClick={sendWaEnroll} disabled={busy || phone.length < 8} aria-busy={busy}>{t.tfWaSend}</button>
            <button className="btn ghost" onClick={reset} disabled={busy}>{t.tfCancel}</button>
          </div>
        </div>
      )}

      {mode === 'enroll-wa-code' && (
        <div className="tf-enroll">
          <p className="pc-desc" style={{ marginTop: 0 }}>{t.tfWaCodeHint}</p>
          {codeInput(confirmWa, t.tfVerifyEnable)}
        </div>
      )}

      {mode === 'disable' && (
        <div>
          <p className="pc-desc" style={{ marginTop: 0 }}>{t.tfDisablePrompt}</p>
          {codeInput(confirmDisable, t.tfConfirmDisable)}
        </div>
      )}

      {mode === 'recovery' && (
        <div className="tf-recovery">
          <p className="pc-desc" style={{ marginTop: 0 }}>{t.tfRecoveryIntro}</p>
          <div className="tf-codes">
            {recovery.map((c) => (<code key={c}>{c}</code>))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn sec" onClick={copyRecovery}>{t.tfCopyCodes}</button>
            <button className="btn ghost" onClick={reset}>{t.tfDone}</button>
          </div>
        </div>
      )}
    </div>
  );
}
