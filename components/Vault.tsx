'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { decryptStr, encryptStr, type Keys } from '@/lib/crypto';
import { generatePassword, type GenOpts } from '@/lib/pwgen';
import { strength } from '@/lib/strength';
import { totpCode, totpRemaining } from '@/lib/totp';
import { OrbitalLoader } from '@/components/OrbitalLoader';

type CustomField = { label: string; value: string };
type Fields = {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  category: string;
  favorite?: boolean;
  totp?: string;
  customFields?: CustomField[];
};
type Item = Fields & { id: string; createdAt?: string; updatedAt?: string };
type View = 'overview' | 'vault' | 'search' | 'favorites' | 'security' | 'generator' | 'backup' | 'settings' | 'faq';

const EMPTY: Fields = {
  title: '', username: '', password: '', url: '', notes: '', category: '', favorite: false, totp: '', customFields: [],
};

const TITLES: Record<View, string> = {
  overview: '🏠 Ringkasan',
  vault: '🔑 Brankas',
  search: '🔍 Cari',
  favorites: '⭐ Favorit',
  security: '🛡️ Keamanan',
  generator: '🎲 Generator Password',
  backup: '📦 Backup',
  settings: '⚙️ Pengaturan',
  faq: '❓ Pertanyaan Umum (FAQ)',
};

export default function Vault({ keys, onLock }: { keys: Keys; onLock: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [view, setView] = useState<View>('overview');
  const [editing, setEditing] = useState<Item | 'new' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [themePref, setThemePref] = useState<'system' | 'dark' | 'light'>('system');

  const flash = useCallback((m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 1600);
  }, []);

  useEffect(() => {
    // Respect a saved choice; otherwise follow the OS dark/light preference.
    const saved = localStorage.getItem('vault-theme') as 'dark' | 'light' | null;
    const system = window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    setThemePref(saved ?? 'system');
    const resolved = saved ?? system;
    setTheme(resolved);
    document.documentElement.dataset.theme = resolved;
  }, []);

  function applyTheme(mode: 'system' | 'dark' | 'light') {
    const system = window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const resolved = mode === 'system' ? system : mode;
    setThemePref(mode);
    setTheme(resolved);
    document.documentElement.dataset.theme = resolved;
    if (mode === 'system') localStorage.removeItem('vault-theme');
    else localStorage.setItem('vault-theme', mode);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/vault');
    if (!res.ok) {
      flash('Gagal memuat');
      setLoading(false);
      setFirstLoad(false);
      return;
    }
    const { items: rows } = (await res.json()) as {
      items: { id: string; data: string; created_at?: string; updated_at?: string }[];
    };
    const out: Item[] = [];
    for (const r of rows ?? []) {
      try {
        const f = JSON.parse(await decryptStr(keys.encKey, r.data)) as Fields;
        out.push({ ...EMPTY, ...f, id: r.id, createdAt: r.created_at, updatedAt: r.updated_at });
      } catch {
        // kunci salah / data rusak — lewati
      }
    }
    setItems(out);
    setLoading(false);
    setFirstLoad(false);
  }, [keys.encKey, flash]);

  useEffect(() => {
    load();
  }, [load]);

  // Keyboard shortcuts: Ctrl/Cmd+K or "/" jumps to Cari (search) and focuses it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing) return; // don't hijack keys while the modal is open
      const el = e.target as HTMLElement | null;
      const typing =
        !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      const isSearch = ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing);
      if (isSearch) {
        e.preventDefault();
        setView('search');
        window.setTimeout(() => document.querySelector<HTMLInputElement>('.search-big')?.focus(), 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing]);

  // Returns true only if the save persisted. The modal stays open on failure so
  // the user's input isn't lost (e.g. a network blip) and they can retry.
  async function save(fields: Fields, id: string | null): Promise<boolean> {
    try {
      const data = await encryptStr(keys.encKey, JSON.stringify(fields));
      const res = await fetch('/api/vault', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(id ? { id, data } : { data }),
      });
      if (!res.ok) {
        flash('Gagal menyimpan — coba lagi');
        return false;
      }
      setEditing(null);
      flash('Tersimpan');
      load();
      return true;
    } catch {
      flash('Gagal menyimpan — cek koneksi');
      return false;
    }
  }

  async function toggleFav(it: Item) {
    const { id, ...rest } = it;
    const data = await encryptStr(keys.encKey, JSON.stringify({ ...rest, favorite: !it.favorite }));
    await fetch('/api/vault', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, data }),
    });
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)));
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

  async function deleteAll() {
    if (!window.confirm('Hapus SEMUA item di brankas? Nggak bisa dibatalkan.')) return;
    for (const it of items) {
      await fetch('/api/vault', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: it.id }),
      });
    }
    flash('Semua item dihapus');
    load();
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash(`${label} disalin`);
      // Auto-clear after N seconds (configurable in Settings; 0 = off) — but
      // only if the clipboard STILL holds what we copied, so we don't wipe
      // something the user copied in the meantime.
      const secs = Number(localStorage.getItem('vault-clipclear') ?? '30');
      if (secs > 0) {
        window.setTimeout(async () => {
          try {
            if ((await navigator.clipboard.readText()) === text) {
              await navigator.clipboard.writeText('');
            }
          } catch {
            /* clipboard not readable — don't clobber it */
          }
        }, secs * 1000);
      }
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

  const favCount = items.filter((i) => i.favorite).length;

  const shown = useMemo(() => {
    const base = view === 'favorites' ? items.filter((i) => i.favorite) : items;
    const q = query.trim().toLowerCase();
    return base.filter((i) => {
      if (cat && i.category.trim() !== cat) return false;
      if (q && ![i.title, i.username, i.url, i.category].some((v) => v.toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [items, query, cat, view]);

  const rowProps = { onCopy: copy, onEditItem: setEditing, onDelete: remove, onToggleFav: toggleFav };

  const NAV: { v: View; label: string; count?: number }[] = [
    { v: 'overview', label: '🏠 Ringkasan' },
    { v: 'vault', label: '🔑 Brankas', count: items.length },
    { v: 'search', label: '🔍 Cari' },
    { v: 'favorites', label: '⭐ Favorit', count: favCount },
    { v: 'security', label: '🛡️ Keamanan' },
    { v: 'generator', label: '🎲 Generator' },
    { v: 'backup', label: '📦 Backup' },
    { v: 'settings', label: '⚙️ Pengaturan' },
    { v: 'faq', label: '❓ FAQ' },
  ];

  const isList = view === 'vault' || view === 'favorites';

  // First open: show the orbital loader while the vault fetches + decrypts.
  if (firstLoad) {
    return (
      <div className="orbit-screen">
        <OrbitalLoader label="Membuka brankas…" />
      </div>
    );
  }

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
          {NAV.map((n) => (
            <button key={n.v} className={`snav ${view === n.v ? 'active' : ''}`} onClick={() => setView(n.v)}>
              <span>{n.label}</span>
              {n.count !== undefined && <span className="cnt">{n.count}</span>}
            </button>
          ))}
        </nav>

        <div className="side-foot">
          <button className="btn ghost" style={{ width: '100%' }} onClick={onLock}>
            🔒 Kunci brankas
          </button>
          <p className="side-note">Terkunci otomatis setelah 30 menit idle</p>
        </div>
      </aside>

      <div className="main2">
        <div className="top">
          {isList ? (
            <>
              <div className="search">
                <input placeholder="Cari…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="sp" />
              <button className="btn sm" onClick={() => setEditing('new')}>
                + Tambah
              </button>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{TITLES[view]}</div>
              <div className="sp" />
            </>
          )}
          <button className="btn ghost sm only-mobile" onClick={onLock}>
            Kunci
          </button>
        </div>

        {view === 'overview' && (
          <OverviewView items={items} onNav={setView} onAdd={() => setEditing('new')} {...rowProps} />
        )}

        {view === 'search' && <SearchView items={items} query={query} setQuery={setQuery} {...rowProps} />}

        {isList && (
          <div className="wrap">
            {view === 'vault' && categories.length > 0 && (
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
                {view === 'favorites'
                  ? 'Belum ada favorit. Klik ⭐ di entri buat menandai.'
                  : items.length === 0
                  ? 'Brankas kosong. Klik + Tambah untuk menyimpan login.'
                  : 'Nggak ada hasil.'}
              </div>
            ) : (
              shown.map((it) => <ItemRow key={it.id} item={it} {...rowProps} />)
            )}
          </div>
        )}

        {view === 'security' && <SecurityView items={items} onEdit={(it) => setEditing(it)} />}
        {view === 'generator' && <GeneratorView onCopy={copy} />}
        {view === 'backup' && <BackupView flash={flash} reload={load} encKey={keys.encKey} />}
        {view === 'settings' && (
          <SettingsView items={items} onLock={onLock} onDeleteAll={deleteAll} themePref={themePref} onSetTheme={applyTheme} flash={flash} />
        )}
        {view === 'faq' && <FaqView />}
      </div>

      {editing && (
        <ItemModal
          initial={editing === 'new' ? EMPTY : editing}
          id={editing === 'new' ? null : editing.id}
          meta={editing === 'new' ? undefined : { createdAt: editing.createdAt, updatedAt: editing.updatedAt }}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

type RowProps = {
  onCopy: (t: string, l: string) => void;
  onEditItem: (it: Item) => void;
  onDelete: (id: string) => void;
  onToggleFav: (it: Item) => void;
};

/* ───────────────────────── Ringkasan ───────────────────────── */
function OverviewView({
  items,
  onNav,
  onAdd,
  ...row
}: { items: Item[]; onNav: (v: View) => void; onAdd: () => void } & RowProps) {
  const fav = items.filter((i) => i.favorite).length;
  const cats = new Set(items.filter((i) => i.category.trim()).map((i) => i.category.trim())).size;
  const weak = items.filter((i) => i.password && i.password.length < 10).length;
  const score = items.length ? Math.round(((items.length - weak) / items.length) * 100) : 100;
  const recent = items.slice(0, 5);
  return (
    <div className="wrap">
      <div className="stats">
        <Stat n={items.length} label="Total login" />
        <Stat n={cats} label="Kategori" />
        <Stat n={fav} label="Favorit" />
        <Stat n={`${score}%`} label="Skor keamanan" tone={score >= 80 ? 'ok' : 'warn'} />
      </div>
      <div className="quick">
        <button className="qbtn" onClick={onAdd}>➕<span>Tambah login</span></button>
        <button className="qbtn" onClick={() => onNav('generator')}>🎲<span>Generator</span></button>
        <button className="qbtn" onClick={() => onNav('security')}>🛡️<span>Cek keamanan</span></button>
        <button className="qbtn" onClick={() => onNav('backup')}>📦<span>Backup</span></button>
      </div>
      <p className="sec-hint">Terbaru</p>
      {recent.length ? (
        recent.map((it) => <ItemRow key={it.id} item={it} {...row} />)
      ) : (
        <div className="empty">Belum ada item. Klik ➕ Tambah login buat mulai.</div>
      )}
    </div>
  );
}

/* ───────────────────────── Cari ───────────────────────── */
function SearchView({
  items,
  query,
  setQuery,
  ...row
}: { items: Item[]; query: string; setQuery: (q: string) => void } & RowProps) {
  const q = query.trim().toLowerCase();
  // Relevance: title starts-with first, then title contains, then username, then
  // other fields — so near-identical names sort together and the best match leads.
  const rankItem = (i: Item): number => {
    const t = i.title.toLowerCase();
    if (t.startsWith(q)) return 0;
    if (t.includes(q)) return 1;
    if (i.username.toLowerCase().includes(q)) return 2;
    if ([i.url, i.category, i.notes].some((v) => (v || '').toLowerCase().includes(q))) return 3;
    return 99;
  };
  const results = q
    ? items
        .map((i) => ({ i, score: rankItem(i) }))
        .filter((x) => x.score < 99)
        .sort((a, b) => a.score - b.score || a.i.title.localeCompare(b.i.title))
        .map((x) => x.i)
    : [];
  return (
    <div className="wrap">
      <input
        className="search-big"
        autoFocus
        placeholder="Cari judul, username, website, kategori, atau catatan…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {!q ? (
        <div className="empty">Ketik buat nyari di {items.length} entri kamu.</div>
      ) : results.length === 0 ? (
        <div className="empty">Nggak ada hasil buat &ldquo;{query}&rdquo;.</div>
      ) : (
        <>
          <p className="sec-hint">{results.length} hasil</p>
          {results.map((it) => (
            <ItemRow key={it.id} item={it} highlight={query.trim()} {...row} />
          ))}
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Keamanan ───────────────────────── */
function SecurityView({ items, onEdit }: { items: Item[]; onEdit: (it: Item) => void }) {
  const { total, weak, reused, noPw, flagged } = useMemo(() => {
    const pwCount = new Map<string, number>();
    for (const i of items) if (i.password) pwCount.set(i.password, (pwCount.get(i.password) || 0) + 1);
    const weak = items.filter((i) => i.password && i.password.length < 10);
    const reused = items.filter((i) => i.password && (pwCount.get(i.password) || 0) > 1);
    const noPw = items.filter((i) => !i.password);
    const flagged = [...new Set([...weak, ...reused])];
    return { total: items.length, weak, reused, noPw, flagged };
  }, [items]);

  return (
    <div className="wrap">
      <div className="stats">
        <Stat n={total} label="Total item" />
        <Stat n={weak.length} label="Password lemah" tone={weak.length ? 'warn' : 'ok'} />
        <Stat n={reused.length} label="Dipakai ulang" tone={reused.length ? 'warn' : 'ok'} />
        <Stat n={noPw.length} label="Tanpa password" tone={noPw.length ? 'warn' : 'ok'} />
      </div>
      {flagged.length > 0 ? (
        <>
          <p className="sec-hint">Item yang sebaiknya diperbaiki:</p>
          {flagged.map((it) => (
            <div className="item" key={it.id}>
              <div className="ic">{(it.title || it.username || '?').charAt(0).toUpperCase()}</div>
              <div className="info">
                <div className="title-row">
                  <span className="ttl">{it.title || '(tanpa judul)'}</span>
                </div>
                <div className="usr" style={{ color: '#e0a13c' }}>
                  {weak.includes(it) ? 'Password lemah (terlalu pendek)' : ''}
                  {weak.includes(it) && reused.includes(it) ? ' · ' : ''}
                  {reused.includes(it) ? 'Dipakai ulang di entri lain' : ''}
                </div>
              </div>
              <div className="acts">
                <button className="iconbtn" title="Perbaiki" onClick={() => onEdit(it)}>
                  <EditIcon />
                </button>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="empty">👍 Aman — nggak ada password yang lemah atau dipakai ulang.</div>
      )}
    </div>
  );
}
function Stat({ n, label, tone }: { n: number | string; label: string; tone?: 'warn' | 'ok' }) {
  return (
    <div className={`stat ${tone ?? ''}`}>
      <div className="stat-n">{n}</div>
      <div className="stat-l">{label}</div>
    </div>
  );
}

/* ───────────────────────── Generator ───────────────────────── */
function GeneratorView({ onCopy }: { onCopy: (t: string, l: string) => void }) {
  const [pw, setPw] = useState('');
  const [opts, setOpts] = useState<GenOpts>({ length: 18, lower: true, upper: true, digit: true, symbol: true });
  const numStyle = { width: 64, padding: '5px 7px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' } as const;
  const st = strength(pw);

  function gen() {
    setPw(generatePassword(opts));
  }
  useEffect(() => {
    gen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wrap">
      <div className="panel-card" style={{ maxWidth: 560 }}>
        <div className="row2">
          <input className="input" style={{ marginBottom: 0, fontFamily: 'ui-monospace, monospace', fontSize: 16 }} readOnly value={pw} />
          <button type="button" className="btn" onClick={gen}>
            Buat
          </button>
        </div>
        {pw && (
          <div className="strength">
            <div className="strength-bar"><span style={{ width: `${(st.score + 1) * 20}%`, background: st.color }} /></div>
            <span className="strength-label" style={{ color: st.color }}>{st.label}</span>
          </div>
        )}
        <button type="button" className="btn sec" style={{ width: '100%', marginTop: 10 }} onClick={() => pw && onCopy(pw, 'Password')}>
          Salin
        </button>
        <div className="opts" style={{ marginTop: 18 }}>
          <label>
            Panjang
            <input
              type="number"
              min={8}
              max={64}
              value={opts.length}
              onChange={(e) => setOpts((o) => ({ ...o, length: Math.max(8, Math.min(64, +e.target.value || 8)) }))}
              style={numStyle}
            />
          </label>
          {(['lower', 'upper', 'digit', 'symbol'] as const).map((k) => (
            <label key={k}>
              <input type="checkbox" checked={opts[k]} onChange={(e) => setOpts((o) => ({ ...o, [k]: e.target.checked }))} />
              {GEN_LABELS[k]}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Backup ───────────────────────── */
function BackupView({
  flash,
  reload,
  encKey,
}: {
  flash: (m: string) => void;
  reload: () => void;
  encKey: CryptoKey;
}) {
  const [busy, setBusy] = useState(false);

  async function exportBackup() {
    setBusy(true);
    try {
      const res = await fetch('/api/vault');
      const { items } = await res.json();
      const blob = new Blob([JSON.stringify({ version: 1, items }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'myvault-backup.json';
      a.click();
      URL.revokeObjectURL(url);
      flash('Backup diunduh');
    } catch {
      flash('Gagal ekspor');
    }
    setBusy(false);
  }

  async function importBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const parsed = JSON.parse(await file.text());
      const rows: { data?: string }[] = parsed.items ?? [];

      // Guard: make sure this backup was made with the SAME master password.
      // Try to decrypt the first real ciphertext; if it fails, the keys differ
      // and importing would just store invisible, undecryptable rows.
      const sample = rows.find((r) => typeof r.data === 'string')?.data;
      if (sample) {
        try {
          await decryptStr(encKey, sample);
        } catch {
          flash('Backup pakai master password berbeda — impor dibatalkan');
          setBusy(false);
          e.target.value = '';
          return;
        }
      }

      let n = 0;
      for (const r of rows) {
        if (typeof r.data === 'string') {
          await fetch('/api/vault', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ data: r.data }),
          });
          n++;
        }
      }
      flash(`${n} item diimpor`);
      reload();
    } catch {
      flash('File backup nggak valid');
    }
    setBusy(false);
    e.target.value = '';
  }

  return (
    <div className="wrap">
      <div className="panel-card" style={{ maxWidth: 600 }}>
        <h3 className="pc-title">⬇ Ekspor backup</h3>
        <p className="pc-desc">
          Unduh salinan <b>terenkripsi</b> semua entri kamu (isinya ciphertext — aman). Simpan buat jaga-jaga.
        </p>
        <button className="btn" disabled={busy} onClick={exportBackup}>
          {busy ? 'Memproses…' : 'Unduh backup'}
        </button>
      </div>
      <div className="panel-card" style={{ maxWidth: 600, marginTop: 14 }}>
        <h3 className="pc-title">⬆ Impor backup</h3>
        <p className="pc-desc">
          Pulihkan dari file backup. Item ditambahkan ke brankas. Wajib pakai <b>master password yang sama</b>.
        </p>
        <label className="btn sec" style={{ display: 'inline-block', cursor: busy ? 'default' : 'pointer' }}>
          Pilih file backup
          <input type="file" accept="application/json" style={{ display: 'none' }} onChange={importBackup} disabled={busy} />
        </label>
      </div>
    </div>
  );
}

/* ───────────────────────── Pengaturan ───────────────────────── */
const THEME_OPTS: ['system' | 'dark' | 'light', string][] = [
  ['system', '🖥️ Sistem'],
  ['dark', '🌙 Gelap'],
  ['light', '☀️ Terang'],
];

function SettingsView({
  items,
  onLock,
  onDeleteAll,
  themePref,
  onSetTheme,
  flash,
}: {
  items: Item[];
  onLock: () => void;
  onDeleteAll: () => void;
  themePref: 'system' | 'dark' | 'light';
  onSetTheme: (m: 'system' | 'dark' | 'light') => void;
  flash: (m: string) => void;
}) {
  const [autolock, setAutolock] = useState('30');
  const [persist, setPersist] = useState(true);
  const [clipclear, setClipclear] = useState('30');

  useEffect(() => {
    setAutolock(localStorage.getItem('vault-autolock') ?? '30');
    setPersist(localStorage.getItem('vault-persist') !== '0');
    setClipclear(localStorage.getItem('vault-clipclear') ?? '30');
  }, []);

  const saveAutolock = (v: string) => { setAutolock(v); localStorage.setItem('vault-autolock', v); flash('Tersimpan'); };
  const saveClip = (v: string) => { setClipclear(v); localStorage.setItem('vault-clipclear', v); flash('Tersimpan'); };
  const togglePersist = () => {
    const next = !persist;
    setPersist(next);
    localStorage.setItem('vault-persist', next ? '1' : '0');
    if (!next) localStorage.removeItem('vault-k'); // stop caching the key now
    flash('Tersimpan');
  };

  const sel = {
    padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--panel-2)', color: 'var(--text)', fontSize: 14, cursor: 'pointer',
  } as const;

  return (
    <div className="wrap">
      <div className="panel-card" style={{ maxWidth: 620 }}>
        <h3 className="pc-title">Tampilan</h3>
        <div className="kv">
          <span>Tema</span>
          <div className="seg">
            {THEME_OPTS.map(([m, label]) => (
              <button key={m} className={`seg-btn ${themePref === m ? 'on' : ''}`} onClick={() => onSetTheme(m)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-card" style={{ maxWidth: 620, marginTop: 14 }}>
        <h3 className="pc-title">Keamanan &amp; privasi</h3>
        <div className="kv">
          <span>Kunci otomatis saat idle</span>
          <select value={autolock} onChange={(e) => saveAutolock(e.target.value)} style={sel}>
            <option value="5">5 menit</option>
            <option value="15">15 menit</option>
            <option value="30">30 menit</option>
            <option value="60">1 jam</option>
            <option value="0">Jangan pernah</option>
          </select>
        </div>
        <div className="kv">
          <span>Auto-bersih clipboard</span>
          <select value={clipclear} onChange={(e) => saveClip(e.target.value)} style={sel}>
            <option value="15">15 detik</option>
            <option value="30">30 detik</option>
            <option value="60">60 detik</option>
            <option value="0">Mati</option>
          </select>
        </div>
        <div className="kv">
          <span>
            Ingat sesi 7 hari
            <br />
            <small style={{ color: 'var(--muted)' }}>Mati = minta master password tiap buka ulang (lebih aman)</small>
          </span>
          <button className={`switch ${persist ? 'on' : ''}`} onClick={togglePersist} aria-label="Ingat sesi">
            <span className="knob" />
          </button>
        </div>
      </div>

      <div className="panel-card" style={{ maxWidth: 620, marginTop: 14 }}>
        <h3 className="pc-title">Info brankas</h3>
        <div className="kv"><span>Total item</span><b>{items.length}</b></div>
        <div className="kv"><span>Favorit</span><b>{items.filter((i) => i.favorite).length}</b></div>
        <div className="kv"><span>Dengan 2FA</span><b>{items.filter((i) => i.totp).length}</b></div>
        <div className="kv"><span>Mode</span><b>Single-user (pribadi)</b></div>
        <div className="kv"><span>Enkripsi</span><b>AES-256-GCM · zero-knowledge</b></div>
        <button className="btn sec" style={{ marginTop: 16 }} onClick={onLock}>
          🔒 Kunci sekarang
        </button>
      </div>

      <div className="panel-card danger" style={{ maxWidth: 620, marginTop: 14 }}>
        <h3 className="pc-title" style={{ color: 'var(--danger)' }}>Zona bahaya</h3>
        <p className="pc-desc">Hapus semua entri di brankas. Tindakan ini permanen dan nggak bisa dibatalkan.</p>
        <button className="btn danger" onClick={onDeleteAll}>
          Hapus semua item
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── FAQ ───────────────────────── */
const FAQS = [
  { q: 'Apa itu myVault?', a: 'Brankas password pribadi yang menyimpan semua login (ID & password) kamu di satu tempat, terenkripsi penuh.' },
  { q: 'Seberapa aman data saya?', a: 'Sangat aman. Semua dienkripsi di perangkat kamu pakai AES-256-GCM sebelum dikirim. Server cuma menyimpan ciphertext yang teracak.' },
  { q: 'Gimana kalau saya lupa master password?', a: 'Sayangnya nggak bisa direset. Master password adalah satu-satunya kunci dan nggak pernah disimpan. Kalau lupa, datanya hilang permanen — catat baik-baik.' },
  { q: 'Bisa diakses dari HP?', a: 'Bisa. Buka URL-nya di browser HP, login pakai email + master password yang sama, datanya langsung kebuka.' },
  { q: 'Siapa yang bisa lihat password saya?', a: 'Cuma kamu. Bahkan pembuatnya nggak bisa baca, karena zero-knowledge — master password nggak pernah keluar dari perangkat kamu.' },
  { q: 'Apa itu menu Ringkasan?', a: 'Halaman utama: ringkasan jumlah login, kategori, favorit, dan skor keamanan, plus aksi cepat dan entri terbaru.' },
  { q: 'Gimana cara menandai favorit?', a: 'Klik ikon ⭐ di entri. Favorit bisa dilihat di menu ⭐ Favorit.' },
  { q: 'Apa itu menu Keamanan?', a: 'Ngecek password lemah (kependekan), dipakai ulang, atau tanpa password. Klik "Perbaiki" buat langsung edit.' },
  { q: 'Gimana cara backup?', a: 'Menu Backup → Unduh backup (file terenkripsi). Pulihkan dengan Impor pakai master password yang sama.' },
  { q: 'Bisa ganti tema?', a: 'Bisa. Menu Pengaturan → toggle tema gelap/terang.' },
  { q: 'Kenapa cuma bisa 1 akun?', a: 'Ini brankas pribadi single-user. Setelah akun pertama dibuat, registrasi otomatis ketutup.' },
];
function FaqView() {
  return (
    <div className="wrap">
      <div className="faq">
        <p className="faq-intro">Hal-hal yang sering ditanyain soal brankas ini.</p>
        {FAQS.map((f, i) => (
          <details key={i} className="faq-item">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

// Relative time in Indonesian, e.g. "3 hari lalu". Runs in the browser.
function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  const units: [number, string][] = [
    [60, 'menit'],
    [3600, 'jam'],
    [86400, 'hari'],
    [2592000, 'bulan'],
    [31536000, 'tahun'],
  ];
  let label = 'menit', value = Math.floor(diff / 60);
  for (let i = 0; i < units.length; i++) {
    const [sec, name] = units[i];
    const next = units[i + 1];
    if (!next || diff < next[0]) {
      value = Math.floor(diff / sec);
      label = name;
      break;
    }
  }
  return `${value} ${label} lalu`;
}

/* ───────────────────────── Item row ───────────────────────── */
function hl(text: string, q?: string): React.ReactNode {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="hl">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function ItemRow({
  item,
  highlight,
  onCopy,
  onEditItem,
  onDelete,
  onToggleFav,
}: { item: Item; highlight?: string } & RowProps) {
  const [show, setShow] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const initial = (item.title || item.username || '?').charAt(0).toUpperCase();
  const href = /^https?:\/\//.test(item.url) ? item.url : `https://${item.url}`;
  const title = item.title || '(tanpa judul)';
  const domain = item.url ? item.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : '';
  const favicon = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : '';
  return (
    <div className="item">
      <div className="ic">
        {favicon && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={favicon} alt="" width={22} height={22} onError={() => setImgErr(true)} />
        ) : (
          initial
        )}
      </div>
      <div className="info">
        <div className="title-row">
          {item.url ? (
            <a className="ttl ttl-link" href={href} target="_blank" rel="noreferrer" title="Buka situs">
              {hl(title, highlight)} ↗
            </a>
          ) : (
            <span className="ttl">{hl(title, highlight)}</span>
          )}
          {item.category && <span className="cat">{hl(item.category, highlight)}</span>}
          {item.password && <StrengthDot pw={item.password} />}
        </div>
        {item.username && <div className="usr">{hl(item.username, highlight)}</div>}
        {item.totp && <TotpBadge secret={item.totp} onCopy={onCopy} />}
        {show && item.password && <div className="pw">{item.password}</div>}
        {show &&
          (item.customFields ?? [])
            .filter((c) => c.label || c.value)
            .map((c, i) => (
              <div className="cf-row" key={i}>
                <span className="cf-label">{c.label || 'Field'}</span>
                <span className="cf-val">{c.value}</span>
                {c.value && (
                  <button className="iconbtn" title="Salin" onClick={() => onCopy(c.value, c.label || 'Field')}>
                    <CopyIcon />
                  </button>
                )}
              </div>
            ))}
        {show && item.notes && <div className="note-row">{item.notes}</div>}
      </div>
      <div className="acts">
        <button
          className={`iconbtn ${item.favorite ? 'fav' : ''}`}
          title={item.favorite ? 'Hapus dari favorit' : 'Jadikan favorit'}
          onClick={() => onToggleFav(item)}
        >
          <StarIcon filled={item.favorite} />
        </button>
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
        <button className="iconbtn" title="Edit" onClick={() => onEditItem(item)}>
          <EditIcon />
        </button>
        <button className="iconbtn danger" title="Hapus" onClick={() => onDelete(item.id)}>
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" style={filled ? { fill: '#e0a13c', stroke: '#e0a13c' } : undefined}>
      <path d="m12 3 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17.8 6.7 19.2l1-5.8L3.5 9.2l5.9-.9z" />
    </svg>
  );
}
function UserIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>; }
function CopyIcon() { return <svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>; }
function EyeIcon() { return <svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>; }
function EyeOffIcon() { return <svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7c2 0 3.8.6 5.3 1.6M22 12s-4 7-10 7c-2 0-3.8-.6-5.3-1.6" /><path d="m4 4 16 16" /></svg>; }
function LinkIcon() { return <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>; }
function EditIcon() { return <svg viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>; }
function TrashIcon() { return <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>; }

// Small coloured dot showing the password's strength.
function StrengthDot({ pw }: { pw: string }) {
  const s = strength(pw);
  return <span className="str-dot" title={`Kekuatan password: ${s.label}`} style={{ background: s.color, color: s.color }} />;
}

// Rotating 2FA code with a 30s countdown ring; click to copy.
function TotpBadge({ secret, onCopy }: { secret: string; onCopy: (t: string, l: string) => void }) {
  const [code, setCode] = useState('······');
  const [left, setLeft] = useState(30);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const c = await totpCode(secret);
      if (alive) {
        setCode(c || '······');
        setLeft(totpRemaining());
      }
    };
    tick();
    const iv = window.setInterval(tick, 1000);
    return () => {
      alive = false;
      window.clearInterval(iv);
    };
  }, [secret]);
  const valid = /^\d{6}$/.test(code);
  const display = valid ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
  return (
    <button type="button" className="totp" title="Kode 2FA — klik buat salin" onClick={() => valid && onCopy(code, 'Kode 2FA')}>
      <span className="totp-ring" style={{ ['--p']: `${(left / 30) * 100}%` } as React.CSSProperties} />
      <span className="totp-code">{display}</span>
      <span className="totp-left">{left}s</span>
    </button>
  );
}

const GEN_LABELS: Record<string, string> = { lower: 'kecil', upper: 'besar', digit: 'angka', symbol: 'simbol' };

/* ───────────────────────── Modal ───────────────────────── */
function ItemModal({
  initial,
  id,
  meta,
  onClose,
  onSave,
}: {
  initial: Fields;
  id: string | null;
  meta?: { createdAt?: string; updatedAt?: string };
  onClose: () => void;
  onSave: (f: Fields, id: string | null) => Promise<boolean>;
}) {
  const [f, setF] = useState<Fields>(initial);
  const [showGen, setShowGen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [opts, setOpts] = useState<GenOpts>({ length: 18, lower: true, upper: true, digit: true, symbol: true });
  const st = strength(f.password);

  const set = (k: keyof Fields, v: string) => setF((p) => ({ ...p, [k]: v }));

  // Esc closes the modal (matches the click-outside-to-close behaviour).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await onSave(f, id);
    // On success the modal unmounts; on failure keep it open + re-enable Simpan.
    if (!ok) setBusy(false);
  }

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{id ? 'Edit entri' : 'Entri baru'}</h2>
        <form onSubmit={submit}>
          <label className="fld">Judul</label>
          <input className="input" autoFocus required value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Facebook" />

          <label className="fld">Username / email</label>
          <input className="input" value={f.username} onChange={(e) => set('username', e.target.value)} placeholder="kamu@email.com" />

          <label className="fld">Password</label>
          <div className="row2">
            <input className="input" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" />
            <button type="button" className="btn sec" onClick={() => setShowGen((s) => !s)}>
              ⚙
            </button>
          </div>
          {f.password && (
            <div className="strength" style={{ margin: '-4px 0 12px' }}>
              <div className="strength-bar"><span style={{ width: `${(st.score + 1) * 20}%`, background: st.color }} /></div>
              <span className="strength-label" style={{ color: st.color }}>{st.label}</span>
            </div>
          )}

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
                    onChange={(e) => setOpts((o) => ({ ...o, length: Math.max(8, Math.min(64, +e.target.value || 8)) }))}
                    style={{ width: 56, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </label>
                {(['lower', 'upper', 'digit', 'symbol'] as const).map((k) => (
                  <label key={k}>
                    <input type="checkbox" checked={opts[k]} onChange={(e) => setOpts((o) => ({ ...o, [k]: e.target.checked }))} />
                    {GEN_LABELS[k]}
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="fld">Website (opsional)</label>
          <input className="input" value={f.url} onChange={(e) => set('url', e.target.value)} placeholder="facebook.com" />

          <label className="fld">Kategori (opsional)</label>
          <input className="input" value={f.category} onChange={(e) => set('category', e.target.value)} placeholder="Sosial" />

          <label className="fld">Catatan (opsional)</label>
          <textarea className="input" rows={3} value={f.notes} onChange={(e) => set('notes', e.target.value)} style={{ resize: 'vertical' }} />

          <label className="fld">Kode 2FA / TOTP (opsional)</label>
          <input
            className="input"
            value={f.totp ?? ''}
            onChange={(e) => set('totp', e.target.value)}
            placeholder="Secret base32, mis. JBSWY3DPEHPK3PXP"
            style={{ fontFamily: 'ui-monospace, monospace' }}
          />

          <label className="fld">Field tambahan (opsional)</label>
          {(f.customFields ?? []).map((field, i) => (
            <div className="row2" key={i} style={{ marginBottom: 8 }}>
              <input
                className="input" style={{ marginBottom: 0, flex: '0 0 34%' }} placeholder="Label"
                value={field.label}
                onChange={(e) => setF((p) => ({ ...p, customFields: (p.customFields ?? []).map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))}
              />
              <input
                className="input" style={{ marginBottom: 0 }} placeholder="Nilai"
                value={field.value}
                onChange={(e) => setF((p) => ({ ...p, customFields: (p.customFields ?? []).map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) }))}
              />
              <button
                type="button" className="btn ghost" title="Hapus field"
                onClick={() => setF((p) => ({ ...p, customFields: (p.customFields ?? []).filter((_, j) => j !== i) }))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button" className="btn sec" style={{ marginBottom: 12 }}
            onClick={() => setF((p) => ({ ...p, customFields: [...(p.customFields ?? []), { label: '', value: '' }] }))}
          >
            + Field tambahan
          </button>

          {meta?.updatedAt && (
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '14px 0 0', textAlign: 'right' }}>
              Diperbarui {timeAgo(meta.updatedAt)}
              {meta.createdAt ? ` · dibuat ${timeAgo(meta.createdAt)}` : ''}
            </p>
          )}
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
