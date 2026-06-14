'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { decryptStr, encryptStr, type Keys } from '@/lib/crypto';
import { generatePassword, type GenOpts } from '@/lib/pwgen';

type Fields = {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  category: string;
};
type Item = Fields & { id: string };

const EMPTY: Fields = { title: '', username: '', password: '', url: '', notes: '', category: '' };

export default function Vault({ keys, onLock }: { keys: Keys; onLock: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [view, setView] = useState<'vault' | 'faq'>('vault');
  const [editing, setEditing] = useState<Item | 'new' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = useCallback((m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 1500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/vault');
    if (!res.ok) {
      flash('Gagal memuat');
      setLoading(false);
      return;
    }
    const { items: rows } = (await res.json()) as { items: { id: string; data: string }[] };
    const out: Item[] = [];
    for (const r of rows ?? []) {
      try {
        const f = JSON.parse(await decryptStr(keys.encKey, r.data)) as Fields;
        out.push({ ...EMPTY, ...f, id: r.id });
      } catch {
        // kunci salah / data rusak — lewati
      }
    }
    setItems(out);
    setLoading(false);
  }, [keys.encKey, flash]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(fields: Fields, id: string | null) {
    const data = await encryptStr(keys.encKey, JSON.stringify(fields));
    const res = await fetch('/api/vault', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(id ? { id, data } : { data }),
    });
    setEditing(null);
    flash(res.ok ? 'Tersimpan' : 'Gagal menyimpan');
    load();
  }

  async function remove(id: string) {
    if (!window.confirm('Hapus entri ini?')) return;
    await fetch('/api/vault', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    flash('Terhapus');
    load();
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash(`${label} disalin`);
      window.setTimeout(() => navigator.clipboard.writeText('').catch(() => {}), 30000);
    } catch {
      flash('Gagal menyalin');
    }
  }

  const categories = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) {
      const c = i.category.trim();
      if (c) m.set(c, (m.get(c) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
  }, [items]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (cat && i.category.trim() !== cat) return false;
      if (q && ![i.title, i.username, i.url, i.category].some((v) => v.toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [items, query, cat]);

  return (
    <div className="shell">
      <aside className="side">
        <div className="side-brand">
          🔐 my<span>Vault</span>
        </div>
        <button
          className="btn"
          style={{ width: '100%', marginBottom: 16 }}
          onClick={() => {
            setView('vault');
            setEditing('new');
          }}
        >
          + Tambah login
        </button>

        <p className="side-label">Menu</p>
        <nav className="side-nav">
          <button className={`snav ${view === 'vault' ? 'active' : ''}`} onClick={() => setView('vault')}>
            <span>🔑 Brankas</span>
            <span className="cnt">{items.length}</span>
          </button>
          <button className={`snav ${view === 'faq' ? 'active' : ''}`} onClick={() => setView('faq')}>
            <span>❓ FAQ</span>
          </button>
        </nav>

        <div className="side-foot">
          <button className="btn ghost" style={{ width: '100%' }} onClick={onLock}>
            🔒 Kunci brankas
          </button>
          <p className="side-note">Terkunci otomatis setelah 10 menit idle</p>
        </div>
      </aside>

      <div className="main2">
        {view === 'vault' ? (
          <>
            <div className="top">
              <div className="search">
                <input placeholder="Cari…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="sp" />
              <button className="btn sm" onClick={() => setEditing('new')}>
                + Tambah
              </button>
              <button className="btn ghost sm only-mobile" onClick={onLock}>
                Kunci
              </button>
            </div>

            <div className="wrap">
              {categories.length > 0 && (
                <div className="chips">
                  <button className={`chip ${cat === null ? 'active' : ''}`} onClick={() => setCat(null)}>
                    Semua ({items.length})
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.name}
                      className={`chip ${cat === c.name ? 'active' : ''}`}
                      onClick={() => setCat(c.name)}
                    >
                      {c.name} ({c.count})
                    </button>
                  ))}
                </div>
              )}

              {loading ? (
                <div className="empty">Mendekripsi…</div>
              ) : shown.length === 0 ? (
                <div className="empty">
                  {items.length === 0
                    ? 'Brankas kosong. Klik + Tambah untuk menyimpan login.'
                    : 'Nggak ada hasil.'}
                </div>
              ) : (
                shown.map((it) => (
                  <ItemRow
                    key={it.id}
                    item={it}
                    onCopy={copy}
                    onEdit={() => setEditing(it)}
                    onDelete={() => remove(it.id)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="top">
              <div style={{ fontWeight: 700, fontSize: 16 }}>❓ Pertanyaan Umum (FAQ)</div>
              <div className="sp" />
              <button className="btn ghost sm only-mobile" onClick={onLock}>
                Kunci
              </button>
            </div>
            <div className="wrap">
              <Faq />
            </div>
          </>
        )}
      </div>

      {editing && (
        <ItemModal
          initial={editing === 'new' ? EMPTY : editing}
          id={editing === 'new' ? null : editing.id}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

const FAQS = [
  {
    q: 'Apa itu myVault?',
    a: 'Brankas password pribadi yang menyimpan semua login (ID & password) kamu di satu tempat, terenkripsi penuh.',
  },
  {
    q: 'Seberapa aman data saya?',
    a: 'Sangat aman. Semua dienkripsi di perangkat kamu pakai AES-256-GCM sebelum dikirim. Server cuma menyimpan ciphertext yang teracak — nggak bisa dibaca siapa pun.',
  },
  {
    q: 'Gimana kalau saya lupa master password?',
    a: 'Sayangnya nggak bisa direset. Master password adalah satu-satunya kunci dan nggak pernah disimpan di mana pun. Kalau lupa, datanya hilang permanen — jadi catat baik-baik.',
  },
  {
    q: 'Bisa diakses dari HP?',
    a: 'Bisa. Buka URL-nya di browser HP, login pakai email + master password yang sama, datanya langsung kebuka.',
  },
  {
    q: 'Siapa yang bisa lihat password saya?',
    a: 'Cuma kamu. Bahkan pembuatnya nggak bisa baca, karena enkripsinya zero-knowledge — master password nggak pernah keluar dari perangkat kamu.',
  },
  {
    q: 'Gimana cara nambah login baru?',
    a: 'Klik "+ Tambah login" atau "+ Tambah", isi judul, username/email, password (bisa pakai generator), dan website (opsional), lalu Simpan.',
  },
  {
    q: 'Apa fungsi field Website?',
    a: 'Kalau diisi, judul entri jadi link yang bisa diklik — langsung membuka website-nya di tab baru.',
  },
  {
    q: 'Kenapa cuma bisa 1 akun?',
    a: 'Ini brankas pribadi single-user. Setelah akun pertama dibuat, registrasi otomatis ketutup — jadi nggak ada yang bisa daftar atau masuk selain kamu.',
  },
];

function Faq() {
  return (
    <div className="faq">
      <p className="faq-intro">Hal-hal yang sering ditanyain soal brankas ini.</p>
      {FAQS.map((f, i) => (
        <details key={i} className="faq-item">
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

function ItemRow({
  item,
  onCopy,
  onEdit,
  onDelete,
}: {
  item: Item;
  onCopy: (t: string, l: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [show, setShow] = useState(false);
  const initial = (item.title || item.username || '?').charAt(0).toUpperCase();
  const href = /^https?:\/\//.test(item.url) ? item.url : `https://${item.url}`;
  return (
    <div className="item">
      <div className="ic">{initial}</div>
      <div className="info">
        <div className="title-row">
          {item.url ? (
            <a className="ttl ttl-link" href={href} target="_blank" rel="noreferrer" title="Buka situs">
              {item.title || '(tanpa judul)'} ↗
            </a>
          ) : (
            <span className="ttl">{item.title || '(tanpa judul)'}</span>
          )}
          {item.category && <span className="cat">{item.category}</span>}
        </div>
        {item.username && <div className="usr">{item.username}</div>}
        {show && item.password && <div className="pw">{item.password}</div>}
      </div>
      <div className="acts">
        {item.username && (
          <button className="iconbtn" title="Salin username" onClick={() => onCopy(item.username, 'Username')}>
            <UserIcon />
          </button>
        )}
        {item.password && (
          <button className="iconbtn primary" title="Salin password" onClick={() => onCopy(item.password, 'Password')}>
            <CopyIcon />
          </button>
        )}
        {item.password && (
          <button className="iconbtn" title={show ? 'Sembunyikan' : 'Lihat password'} onClick={() => setShow((s) => !s)}>
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
        {item.url && (
          <a className="iconbtn" title="Buka situs" href={href} target="_blank" rel="noreferrer">
            <LinkIcon />
          </a>
        )}
        <button className="iconbtn" title="Edit" onClick={onEdit}>
          <EditIcon />
        </button>
        <button className="iconbtn danger" title="Hapus" onClick={onDelete}>
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

function UserIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>; }
function CopyIcon() { return <svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>; }
function EyeIcon() { return <svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>; }
function EyeOffIcon() { return <svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7c2 0 3.8.6 5.3 1.6M22 12s-4 7-10 7c-2 0-3.8-.6-5.3-1.6" /><path d="m4 4 16 16" /></svg>; }
function LinkIcon() { return <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>; }
function EditIcon() { return <svg viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>; }
function TrashIcon() { return <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>; }

const GEN_LABELS: Record<string, string> = {
  lower: 'kecil',
  upper: 'besar',
  digit: 'angka',
  symbol: 'simbol',
};

function ItemModal({
  initial,
  id,
  onClose,
  onSave,
}: {
  initial: Fields;
  id: string | null;
  onClose: () => void;
  onSave: (f: Fields, id: string | null) => void;
}) {
  const [f, setF] = useState<Fields>(initial);
  const [showGen, setShowGen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [opts, setOpts] = useState<GenOpts>({
    length: 18,
    lower: true,
    upper: true,
    digit: true,
    symbol: true,
  });

  const set = (k: keyof Fields, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await onSave(f, id);
    setBusy(false);
  }

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{id ? 'Edit entri' : 'Entri baru'}</h2>
        <form onSubmit={submit}>
          <label className="fld">Judul</label>
          <input
            className="input"
            required
            value={f.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Facebook"
          />

          <label className="fld">Username / email</label>
          <input
            className="input"
            value={f.username}
            onChange={(e) => set('username', e.target.value)}
            placeholder="kamu@email.com"
          />

          <label className="fld">Password</label>
          <div className="row2">
            <input
              className="input"
              value={f.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="••••••••"
            />
            <button type="button" className="btn sec" onClick={() => setShowGen((s) => !s)}>
              ⚙
            </button>
          </div>

          {showGen && (
            <div className="gen">
              <div className="row2">
                <input className="input" style={{ marginBottom: 0 }} readOnly value={f.password} />
                <button type="button" className="btn" onClick={() => set('password', generatePassword(opts))}>
                  Buat
                </button>
              </div>
              <div className="opts">
                <label>
                  Pjg
                  <input
                    type="number"
                    min={8}
                    max={64}
                    value={opts.length}
                    onChange={(e) =>
                      setOpts((o) => ({ ...o, length: Math.max(8, Math.min(64, +e.target.value || 8)) }))
                    }
                    style={{ width: 56, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </label>
                {(['lower', 'upper', 'digit', 'symbol'] as const).map((k) => (
                  <label key={k}>
                    <input
                      type="checkbox"
                      checked={opts[k]}
                      onChange={(e) => setOpts((o) => ({ ...o, [k]: e.target.checked }))}
                    />
                    {GEN_LABELS[k]}
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="fld">Website (opsional)</label>
          <input
            className="input"
            value={f.url}
            onChange={(e) => set('url', e.target.value)}
            placeholder="facebook.com"
          />

          <label className="fld">Kategori (opsional)</label>
          <input
            className="input"
            value={f.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="Sosial"
          />

          <label className="fld">Catatan (opsional)</label>
          <textarea
            className="input"
            rows={3}
            value={f.notes}
            onChange={(e) => set('notes', e.target.value)}
            style={{ resize: 'vertical' }}
          />

          <div className="modal-acts">
            <button type="button" className="btn ghost" onClick={onClose}>
              Batal
            </button>
            <button className="btn" disabled={busy}>
              {busy ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
