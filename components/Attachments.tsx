'use client';

import { useEffect, useRef, useState } from 'react';
import { encryptBytes, decryptBytes, encryptStr, decryptStr } from '@/lib/crypto';
import { useAppT } from '@/lib/app-i18n';

const MAX_BYTES = 2.5 * 1024 * 1024; // keeps the encrypted request under Vercel's body cap

type Att = { id: string; name: string; type: string; size: number };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// Encrypted file attachments for one item. Files are encrypted in the browser
// (bytes + filename) before upload; the server only stores ciphertext.
export function Attachments({ itemId, encKey }: { itemId: string; encKey: CryptoKey }) {
  const t = useAppT();
  const [list, setList] = useState<Att[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function refresh() {
    try {
      const res = await fetch(`/api/attachments?item=${encodeURIComponent(itemId)}`);
      const d = await res.json();
      if (d.unavailable) { setUnavailable(true); setList([]); return; }
      const rows = (d.attachments ?? []) as { id: string; meta: string; size: number }[];
      const out: Att[] = [];
      for (const r of rows) {
        try {
          const { name, type } = JSON.parse(await decryptStr(encKey, r.meta)) as { name: string; type: string };
          out.push({ id: r.id, name, type, size: r.size });
        } catch {
          out.push({ id: r.id, name: '???', type: '', size: r.size });
        }
      }
      setList(out);
    } catch {
      setList([]);
    }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [itemId]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr(null);
    if (file.size > MAX_BYTES) { setErr(t.attMaxSize); return; }
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const data = await encryptBytes(encKey, bytes);
      const meta = await encryptStr(encKey, JSON.stringify({ name: file.name, type: file.type || 'application/octet-stream' }));
      const res = await fetch('/api/attachments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId, meta, data, size: file.size }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(res.status === 413 ? t.attMaxSize : res.status === 503 ? t.attUnavailable : d.error || t.attUploadFailed);
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function download(a: Att) {
    setErr(null);
    try {
      const res = await fetch(`/api/attachments/${a.id}`);
      if (!res.ok) { setErr(t.attDownloadFailed); return; }
      const { data } = (await res.json()) as { data: string };
      const bytes = await decryptBytes(encKey, data);
      const blob = new Blob([bytes as unknown as BlobPart], { type: a.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = a.name || 'file';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch {
      setErr(t.attDownloadFailed);
    }
  }

  async function remove(a: Att) {
    setBusy(true);
    try {
      await fetch(`/api/attachments/${a.id}`, { method: 'DELETE' });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="att">
      <label className="fld" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span>{t.attSection}</span>
        {!unavailable && (
          <button type="button" className="btn ghost sm" style={{ padding: '2px 10px', fontSize: 12 }} disabled={busy} onClick={() => fileInput.current?.click()}>
            {busy ? t.attWorking : t.attAdd}
          </button>
        )}
      </label>
      <input ref={fileInput} type="file" hidden onChange={onPick} />

      {unavailable ? (
        <p className="hint" style={{ color: 'var(--muted)' }}>{t.attUnavailableHint}</p>
      ) : list === null ? (
        <p className="hint" style={{ color: 'var(--muted)' }}>…</p>
      ) : list.length === 0 ? (
        <p className="hint" style={{ color: 'var(--muted)' }}>{t.attEmpty}</p>
      ) : (
        <div className="att-list">
          {list.map((a) => (
            <div className="att-row" key={a.id}>
              <span className="att-ic" aria-hidden="true">📎</span>
              <span className="att-name" title={a.name}>{a.name}</span>
              <span className="att-size">{formatBytes(a.size)}</span>
              <button type="button" className="iconbtn" title={t.attDownload} aria-label={t.attDownload} onClick={() => download(a)}>⬇</button>
              <button type="button" className="iconbtn danger" title={t.attDelete} aria-label={t.attDelete} disabled={busy} onClick={() => remove(a)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {err && <p className="hint" style={{ color: 'var(--danger)' }}>{err}</p>}
      {!unavailable && <p className="hint" style={{ color: 'var(--muted)', marginTop: 4 }}>🔒 {t.attEncNote} · {t.attMaxSize}</p>}
    </div>
  );
}
