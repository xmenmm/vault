'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { decryptStr, encryptStr, type Keys } from '@/lib/crypto';
import { generatePassword, generatePassphrase, passphraseEntropy, passwordEntropy, type GenOpts, type PassphraseOpts } from '@/lib/pwgen';
import { strength, strengthFromBits, crackTimeLabel } from '@/lib/strength';
import { pwnedCount } from '@/lib/breach';
import { parseCsv, csvToLogins, toCsv } from '@/lib/csv';
import { totpCode, totpRemaining } from '@/lib/totp';
import { OrbitalLoader } from '@/components/OrbitalLoader';
import { getInstallPrompt, clearInstallPrompt } from '@/components/Pwa';
import { biometricAvailable, biometricEnabled, enableBiometric, disableBiometric } from '@/lib/webauthn';
import { useAppT, type AppDict } from '@/lib/app-i18n';
import { useLang } from '@/lib/i18n';

type CustomField = { label: string; value: string };
type ItemType = 'login' | 'card' | 'note' | 'identity';
type Fields = {
  type?: ItemType;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  category: string;
  favorite?: boolean;
  totp?: string;
  customFields?: CustomField[];
  // When the password was last changed (set only on password change) — used for
  // the "password lama" reminder so unrelated edits (favorite, title) don't reset it.
  passwordUpdatedAt?: string;
  // Kartu kredit/debit
  cardHolder?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  // Identitas
  fullName?: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
};
type Item = Fields & { id: string; createdAt?: string; updatedAt?: string };
type View = 'overview' | 'vault' | 'search' | 'favorites' | 'security' | 'generator' | 'backup' | 'settings' | 'faq';

const ITEM_TYPES: { key: ItemType; label: string; icon: string }[] = [
  { key: 'login', label: 'Login', icon: '🔑' },
  { key: 'card', label: 'Kartu', icon: '💳' },
  { key: 'note', label: 'Catatan', icon: '📝' },
  { key: 'identity', label: 'Identitas', icon: '🪪' },
];
const typeOf = (it: { type?: ItemType }): ItemType => it.type ?? 'login';
const typeMeta = (t: ItemType) => ITEM_TYPES.find((x) => x.key === t) ?? ITEM_TYPES[0];
const typeLabel = (t: ItemType, dict: AppDict): string =>
  t === 'card' ? dict.typeCard : t === 'note' ? dict.typeNote : t === 'identity' ? dict.typeIdentity : dict.typeLogin;

const EMPTY: Fields = {
  type: 'login', title: '', username: '', password: '', url: '', notes: '', category: '', favorite: false, totp: '', customFields: [],
  cardHolder: '', cardNumber: '', cardExpiry: '', cardCvv: '',
  fullName: '', idNumber: '', phone: '', email: '', address: '',
};

const titlesFor = (t: AppDict): Record<View, string> => ({
  overview: t.titleOverview,
  vault: t.titleVault,
  search: t.titleSearch,
  favorites: t.titleFavorites,
  security: t.titleSecurity,
  generator: t.titleGenerator,
  backup: t.titleBackup,
  settings: t.titleSettings,
  faq: t.titleFaq,
});

export default function Vault({ keys, onLock }: { keys: Keys; onLock: () => void }) {
  const t = useAppT();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'weak'>('recent');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [view, setView] = useState<View>('overview');
  const [editing, setEditing] = useState<Item | 'new' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Recently-deleted item kept briefly so a delete can be undone (no confirm prompt).
  const [undo, setUndo] = useState<Fields | null>(null);
  const undoTimer = useRef<number | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [themePref, setThemePref] = useState<'system' | 'dark' | 'light'>('system');
  // "Buka & login" terpandu — sequences copy-username → open-site → copy-password
  // across a tab switch (the only safe way to "auto-login" from a web app on HP).
  const [loginFlow, setLoginFlow] = useState<{ item: Item; step: 'opened' | 'ready' | 'done' } | null>(null);

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
      flash(t.loadFailed);
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
  }, [keys.encKey, flash, t]);

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
        flash(t.saveFailedRetry);
        return false;
      }
      setEditing(null);
      flash(t.saved);
      load();
      return true;
    } catch {
      flash(t.saveFailedConn);
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

  async function remove(it: Item) {
    // No confirm dialog — deleting surfaces an "Undo" bar for a few seconds.
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    const { id, createdAt: _c, updatedAt: _u, ...fields } = it;
    void _c;
    void _u;
    setItems((prev) => prev.filter((p) => p.id !== id));
    setUndo(fields);
    undoTimer.current = window.setTimeout(() => setUndo(null), 6000);
    await fetch('/api/vault', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  async function undoDelete() {
    if (!undo) return;
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    const fields = undo;
    setUndo(null);
    try {
      const data = await encryptStr(keys.encKey, JSON.stringify(fields));
      await fetch('/api/vault', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      flash(t.restored);
      load();
    } catch {
      flash(t.saveFailedConn);
    }
  }

  async function deleteAll() {
    if (!window.confirm(t.confirmDeleteAll)) return;
    for (const it of items) {
      await fetch('/api/vault', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: it.id }),
      });
    }
    flash(t.allDeleted);
    load();
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash(`${label} ${t.copySuffix}`);
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
      flash(t.copyFailed);
    }
  }

  // Step 1: copy the username, open the site in a new tab, and remember we're
  // mid-login so the password step can surface when the user comes back.
  function startLogin(it: Item) {
    if (!it.url) {
      flash(t.noWebsite);
      return;
    }
    const href = /^https?:\/\//.test(it.url) ? it.url : `https://${it.url}`;
    if (it.username) copy(it.username, t.lblUsername);
    window.open(href, '_blank', 'noopener,noreferrer');
    setLoginFlow({ item: it, step: 'opened' });
  }

  // Step 2: copy the password, then auto-dismiss the bar shortly after.
  function copyLoginPw() {
    if (!loginFlow) return;
    copy(loginFlow.item.password, t.lblPassword);
    setLoginFlow((f) => (f ? { ...f, step: 'done' } : f));
    window.setTimeout(() => setLoginFlow((f) => (f && f.step === 'done' ? null : f)), 4500);
  }

  // When the user returns to this tab mid-flow, advance to the "salin password"
  // step automatically so they don't have to find the item again.
  useEffect(() => {
    if (!loginFlow) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setLoginFlow((f) => (f && f.step === 'opened' ? { ...f, step: 'ready' } : f));
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [loginFlow]);

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
    const filtered = base.filter((i) => {
      if (cat && i.category.trim() !== cat) return false;
      if (q && ![i.title, i.username, i.url, i.category].some((v) => v.toLowerCase().includes(q)))
        return false;
      return true;
    });
    const out = [...filtered];
    if (sortBy === 'title') {
      out.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'weak') {
      const sc = (i: Item) => (i.password ? strength(i.password).score : 99);
      out.sort((a, b) => sc(a) - sc(b) || (a.title || '').localeCompare(b.title || ''));
    } else {
      const ts = (i: Item) => (i.updatedAt ? new Date(i.updatedAt).getTime() : 0);
      out.sort((a, b) => ts(b) - ts(a));
    }
    return out;
  }, [items, query, cat, view, sortBy]);

  const rowProps = { onCopy: copy, onEditItem: setEditing, onDelete: remove, onToggleFav: toggleFav, onLogin: startLogin };

  // ── Bulk selection ──
  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);
  const exitSelect = useCallback(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, []);
  const selectAllShown = () => setSelected(new Set(shown.map((i) => i.id)));

  async function bulkDelete() {
    if (!selected.size) return;
    if (!window.confirm(`${t.confirmBulkDeletePrefix} ${selected.size} ${t.confirmBulkDeleteSuffix}`)) return;
    for (const id of selected) {
      await fetch('/api/vault', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    }
    flash(`${selected.size} ${t.bulkDeletedSuffix}`);
    exitSelect();
    load();
  }
  async function bulkFav() {
    const toFav = items.filter((i) => selected.has(i.id) && !i.favorite);
    if (!toFav.length) {
      flash(t.allSelectedAlreadyFav);
      return;
    }
    for (const it of toFav) await toggleFav(it);
    flash(`${toFav.length} ${t.bulkFavedSuffix}`);
    exitSelect();
  }

  const goView = (v: View) => {
    exitSelect();
    setView(v);
  };

  const NAV: { v: View; label: string; count?: number }[] = [
    { v: 'overview', label: t.navOverview },
    { v: 'vault', label: t.navVault, count: items.length },
    { v: 'search', label: t.navSearch },
    { v: 'favorites', label: t.navFavorites, count: favCount },
    { v: 'security', label: t.navSecurity },
    { v: 'generator', label: t.navGenerator },
    { v: 'backup', label: t.navBackup },
    { v: 'settings', label: t.navSettings },
    { v: 'faq', label: t.navFaq },
  ];

  const isList = view === 'vault' || view === 'favorites';

  // First open: show the orbital loader while the vault fetches + decrypts.
  if (firstLoad) {
    return (
      <div className="orbit-screen">
        <OrbitalLoader label={t.openingVault} />
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
          {t.addItem}
        </button>

        <p className="side-label">{t.menu}</p>
        <nav className="side-nav">
          {NAV.map((n) => (
            <button key={n.v} className={`snav ${view === n.v ? 'active' : ''}`} onClick={() => goView(n.v)}>
              <span>{n.label}</span>
              {n.count !== undefined && <span className="cnt">{n.count}</span>}
            </button>
          ))}
        </nav>

        <div className="side-foot">
          <button className="btn ghost" style={{ width: '100%' }} onClick={onLock}>
            {t.lockVault}
          </button>
          <p className="side-note">{t.autoLockNote}</p>
        </div>
      </aside>

      <div className="main2">
        <div className="top">
          {isList ? (
            <>
              <div className="search">
                <input placeholder={t.searchShort} value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="sp" />
              <select
                className="sort-sel"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'title' | 'weak')}
                title={t.sortTitle}
              >
                <option value="recent">{t.sortRecent}</option>
                <option value="title">{t.sortAZ}</option>
                <option value="weak">{t.sortWeak}</option>
              </select>
              <button
                className={`btn sm ${selectMode ? '' : 'ghost'}`}
                onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
                title={t.selectMany}
              >
                {selectMode ? t.done : t.selectToggle}
              </button>
              <button className="btn sm" onClick={() => setEditing('new')}>
                {t.addShort}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{titlesFor(t)[view]}</div>
              <div className="sp" />
            </>
          )}
          <button className="btn ghost sm only-mobile" onClick={onLock}>
            {t.lock}
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
                  {t.allCount} ({items.length})
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
              <div className="empty">{t.decrypting}</div>
            ) : shown.length === 0 ? (
              <div className="empty">
                {view === 'favorites'
                  ? t.emptyFavorites
                  : items.length === 0
                  ? t.emptyVault
                  : t.noResults}
              </div>
            ) : (
              shown.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  {...rowProps}
                  selectMode={selectMode}
                  selected={selected.has(it.id)}
                  onToggleSelect={toggleSelect}
                />
              ))
            )}
          </div>
        )}

        {view === 'security' && <SecurityView items={items} onEdit={(it) => setEditing(it)} />}
        {view === 'generator' && <GeneratorView onCopy={copy} />}
        {view === 'backup' && <BackupView flash={flash} reload={load} encKey={keys.encKey} />}
        {view === 'settings' && (
          <SettingsView items={items} keys={keys} onLock={onLock} onDeleteAll={deleteAll} themePref={themePref} onSetTheme={applyTheme} flash={flash} />
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

      {loginFlow && (
        <LoginFlowBar
          item={loginFlow.item}
          step={loginFlow.step}
          onCopyPw={copyLoginPw}
          onReopen={() => startLogin(loginFlow.item)}
          onClose={() => setLoginFlow(null)}
        />
      )}

      {selectMode && isList && (
        <div className="selbar">
          <span className="selbar-count">{selected.size} {t.selectedSuffix}</span>
          <div className="selbar-acts">
            <button className="btn sm ghost" onClick={selectAllShown}>{t.selectAll} ({shown.length})</button>
            <button className="btn sm sec" disabled={!selected.size} onClick={bulkFav}>{t.bulkFav}</button>
            <button className="btn sm danger" disabled={!selected.size} onClick={bulkDelete}>{t.bulkDelete}</button>
            <button className="iconbtn" title={t.done} onClick={exitSelect}>✕</button>
          </div>
        </div>
      )}

      {undo && (
        <div className="undobar">
          <span>{t.deleted}</span>
          <button className="undo-btn" onClick={undoDelete}>↩ {t.undo}</button>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

type RowProps = {
  onCopy: (t: string, l: string) => void;
  onEditItem: (it: Item) => void;
  onDelete: (it: Item) => void;
  onToggleFav: (it: Item) => void;
  onLogin?: (it: Item) => void;
};

/* ───────────────────────── Ringkasan ───────────────────────── */
function greetingFor(h: number, t: AppDict): string {
  if (h < 11) return t.greetingMorning;
  if (h < 15) return t.greetingNoon;
  if (h < 19) return t.greetingAfternoon;
  return t.greetingEvening;
}

function OverviewView({
  items,
  onNav,
  onAdd,
  ...row
}: { items: Item[]; onNav: (v: View) => void; onAdd: () => void } & RowProps) {
  const t = useAppT();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const fav = items.filter((i) => i.favorite).length;
  const cats = new Set(items.filter((i) => i.category.trim()).map((i) => i.category.trim())).size;
  const withTotp = items.filter((i) => i.totp).length;
  const loginCount = items.filter((i) => typeOf(i) === 'login').length;
  const withPw = items.filter((i) => !!i.password).length;
  const pwCount = new Map<string, number>();
  for (const i of items) if (i.password) pwCount.set(i.password, (pwCount.get(i.password) || 0) + 1);
  const weakList = items.filter((i) => i.password && i.password.length < 10);
  const reusedList = items.filter((i) => i.password && (pwCount.get(i.password) || 0) > 1);
  const weak = weakList.length;
  const reused = reusedList.length;
  const noPw = items.filter((i) => typeOf(i) === 'login' && !i.password).length;
  // Each problem password counted once — same formula as the Keamanan screen.
  const bad = new Set([...weakList, ...reusedList]).size;
  const score = withPw ? Math.round(((withPw - bad) / withPw) * 100) : 100;
  // Genuinely most-recently-updated, not just API order.
  const recent = [...items]
    .sort((a, b) => (b.updatedAt ? +new Date(b.updatedAt) : 0) - (a.updatedAt ? +new Date(a.updatedAt) : 0))
    .slice(0, 6);

  const dateStr = now.toLocaleDateString(t.localeTag, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString(t.localeTag, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const attention: { label: string; n: number; hint: string; tone: string }[] = [
    { label: t.attnWeak, n: weak, hint: t.attnWeakHint, tone: weak ? 'warn' : 'ok' },
    { label: t.attnReused, n: reused, hint: t.attnReusedHint, tone: reused ? 'warn' : 'ok' },
    { label: t.attnNo2fa, n: Math.max(0, loginCount - withTotp), hint: t.attnNo2faHint, tone: 'muted' },
    { label: t.attnNoPw, n: noPw, hint: t.attnNoPwHint, tone: noPw ? 'warn' : 'ok' },
  ];

  return (
    <div className="wrap">
      <div className="panel-card dash-header">
        <div>
          <div className="dash-status"><span className="dot" /> {t.dashStatus}</div>
          <h2 className="dash-greet">{greetingFor(now.getHours(), t)}, admin 👋</h2>
          <p className="dash-sub">{dateStr}</p>
        </div>
        <div className="dash-clock">{timeStr}</div>
      </div>

      <div className="stats">
        <Stat n={items.length} label={t.statTotal} />
        <Stat n={cats} label={t.statCategories} />
        <Stat n={fav} label={t.statFavorites} />
        <Stat n={withTotp} label={t.statWith2fa} />
        <Stat n={`${score}%`} label={t.statSecurityScore} tone={score >= 80 ? 'ok' : 'warn'} />
      </div>

      <div className="dash-grid">
        <div>
          <p className="sec-hint">{t.actionCenter}</p>
          <div className="action-grid">
            {attention.map((a) => (
              <button key={a.label} className="action-card" onClick={() => onNav('security')}>
                <span className={`action-n ${a.tone}`}>{a.n}</span>
                <span className="action-l">{a.label}</span>
                <span className="action-h">{a.hint}</span>
              </button>
            ))}
          </div>
          <p className="sec-hint" style={{ marginTop: 22 }}>{t.quickActions}</p>
          <div className="quick">
            <button className="qbtn" onClick={onAdd}>➕<span>{t.quickAdd}</span></button>
            <button className="qbtn" onClick={() => onNav('generator')}>🎲<span>{t.quickGenerator}</span></button>
            <button className="qbtn" onClick={() => onNav('backup')}>📦<span>{t.quickBackup}</span></button>
          </div>
        </div>
        <div>
          <p className="sec-hint">{t.recentActivity}</p>
          {recent.length ? (
            recent.map((it) => <ItemRow key={it.id} item={it} {...row} />)
          ) : (
            <div className="empty">{t.emptyRecent}</div>
          )}
        </div>
      </div>
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
  const t = useAppT();
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
        placeholder={t.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {!q ? (
        <div className="empty">{t.searchHintPrefix} {items.length} {t.searchHintSuffix}</div>
      ) : results.length === 0 ? (
        <div className="empty">{t.searchNoResultPrefix} &ldquo;{query}&rdquo;.</div>
      ) : (
        <>
          <p className="sec-hint">{results.length} {t.resultsSuffix}</p>
          {results.map((it) => (
            <ItemRow key={it.id} item={it} highlight={query.trim()} {...row} />
          ))}
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Keamanan ───────────────────────── */
const STRENGTH_COLORS = ['#e0503c', '#e0834c', '#e0a13c', '#7bbf4c', '#2bb079'];
const strengthLabels = (t: AppDict): string[] => [
  t.strengthVeryWeak, t.strengthWeak, t.strengthMedium, t.strengthStrong, t.strengthVeryStrong,
];

function SecurityView({ items, onEdit }: { items: Item[]; onEdit: (it: Item) => void }) {
  const t = useAppT();
  const m = useMemo(() => {
    const pwCount = new Map<string, number>();
    for (const i of items) if (i.password) pwCount.set(i.password, (pwCount.get(i.password) || 0) + 1);
    const weak = items.filter((i) => i.password && i.password.length < 10);
    const reused = items.filter((i) => i.password && (pwCount.get(i.password) || 0) > 1);
    // Only login items are expected to have a password — don't flag cards/notes.
    const noPw = items.filter((i) => typeOf(i) === 'login' && !i.password);
    const withPw = items.filter((i) => !!i.password).length;
    const loginCount = items.filter((i) => typeOf(i) === 'login').length;
    const withTotp = items.filter((i) => i.totp).length;
    const flagged = [...new Set([...weak, ...reused])];
    // Login passwords not changed in over 6 months — worth rotating. Uses the
    // password-change time when known, else the row's update time (older items).
    const staleBefore = Date.now() - 180 * 86400000;
    const stale = items.filter((i) => {
      if (typeOf(i) !== 'login' || !i.password) return false;
      const when = i.passwordUpdatedAt || i.updatedAt;
      return when ? new Date(when).getTime() < staleBefore : false;
    });
    const dist = [0, 0, 0, 0, 0];
    for (const i of items) if (i.password) dist[strength(i.password).score]++;
    const total = items.length;
    // Count each problem password once (a weak+reused password is one bad item).
    const score = withPw
      ? Math.max(0, Math.min(100, Math.round(((withPw - flagged.length) / withPw) * 100)))
      : 100;
    return { total, weak, reused, noPw, withPw, loginCount, withTotp, flagged, stale, dist, score };
  }, [items]);

  const { total, weak, reused, noPw, flagged } = m;
  const scoreColor = m.score >= 80 ? 'var(--ok)' : m.score >= 50 ? '#e0a13c' : 'var(--danger)';
  const scoreLabel = m.score >= 80 ? t.scoreHealthy : m.score >= 50 ? t.scoreNeedsAttn : t.scoreRisky;
  const totpPct = m.loginCount ? Math.round((m.withTotp / m.loginCount) * 100) : 0;
  const distMax = Math.max(1, ...m.dist);

  const [scan, setScan] = useState<{
    state: 'idle' | 'running' | 'done';
    done: number;
    total: number;
    breached: { item: Item; count: number }[];
  }>({ state: 'idle', done: 0, total: 0, breached: [] });

  async function runScan() {
    // Dedupe by password so identical logins are only one network lookup.
    const uniq = new Map<string, Item[]>();
    for (const it of items) if (it.password) {
      const a = uniq.get(it.password) || [];
      a.push(it);
      uniq.set(it.password, a);
    }
    const entries = [...uniq.entries()];
    setScan({ state: 'running', done: 0, total: entries.length, breached: [] });
    const breached: { item: Item; count: number }[] = [];
    let done = 0;
    for (const [pw, its] of entries) {
      try {
        const c = await pwnedCount(pw);
        if (c > 0) for (const it of its) breached.push({ item: it, count: c });
      } catch {
        /* skip a failed lookup, keep going */
      }
      done++;
      setScan((s) => ({ ...s, done }));
    }
    setScan({ state: 'done', done, total: entries.length, breached });
  }

  return (
    <div className="wrap">
      <div className="sec-top">
        <div className="panel-card sec-gauge-card">
          <div className="gauge" style={{ ['--p']: `${m.score}`, ['--c']: scoreColor } as React.CSSProperties}>
            <div className="gauge-hole">
              <span className="gauge-n" style={{ color: scoreColor }}>{m.score}</span>
              <span className="gauge-u">/ 100</span>
            </div>
          </div>
          <div className="gauge-side">
            <div className="gauge-label" style={{ color: scoreColor }}>{scoreLabel}</div>
            <p className="gauge-desc">{t.gaugeDesc}</p>
            <div className="sec-mini">
              <div><b>{m.withTotp}</b><span>{t.miniUse2fa}</span></div>
              <div><b>{Math.max(0, m.withPw - weak.length)}</b><span>{t.miniSafePw}</span></div>
              <div><b>{totpPct}%</b><span>{t.mini2faCoverage}</span></div>
            </div>
          </div>
        </div>

        <div className="panel-card sec-dist-card">
          <h3 className="pc-title">{t.distTitle}</h3>
          <div className="dist">
            {strengthLabels(t).map((lbl, i) => (
              <div className="dist-row" key={i}>
                <span className="dist-l">{lbl}</span>
                <div className="dist-bar"><span style={{ width: `${(m.dist[i] / distMax) * 100}%`, background: STRENGTH_COLORS[i] }} /></div>
                <span className="dist-n">{m.dist[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-card breach-card">
        <div className="breach-head">
          <div>
            <h3 className="pc-title">{t.breachTitle}</h3>
            <p className="pc-desc">{t.breachDesc}</p>
          </div>
          <button className="btn" disabled={scan.state === 'running'} onClick={runScan}>
            {scan.state === 'running' ? `${t.breachCheckingPrefix} ${scan.done}/${scan.total}` : scan.state === 'done' ? t.breachRecheck : t.breachCheckNow}
          </button>
        </div>
        {scan.state === 'done' &&
          (scan.breached.length === 0 ? (
            <div className="breach-ok">{t.breachOk}</div>
          ) : (
            <>
              <div className="breach-warn">{t.breachWarnPrefix} {scan.breached.length} {t.breachWarnSuffix}</div>
              {scan.breached.map(({ item, count }) => (
                <div className="item" key={item.id}>
                  <div className="ic">{(item.title || item.username || '?').charAt(0).toUpperCase()}</div>
                  <div className="info">
                    <div className="title-row"><span className="ttl">{item.title || t.noTitle}</span></div>
                    <div className="usr" style={{ color: 'var(--danger)' }}>{t.breachFoundPrefix} {count.toLocaleString(t.localeTag)}{t.breachFoundSuffix}</div>
                  </div>
                  <div className="acts">
                    <button className="iconbtn" title={t.fix} onClick={() => onEdit(item)}><EditIcon /></button>
                  </div>
                </div>
              ))}
            </>
          ))}
      </div>

      <div className="stats">
        <Stat n={total} label={t.statTotal} />
        <Stat n={weak.length} label={t.statWeak} tone={weak.length ? 'warn' : 'ok'} />
        <Stat n={reused.length} label={t.statReused} tone={reused.length ? 'warn' : 'ok'} />
        <Stat n={noPw.length} label={t.statNoPw} tone={noPw.length ? 'warn' : 'ok'} />
      </div>
      {flagged.length > 0 ? (
        <>
          <p className="sec-hint">{t.fixListTitle}</p>
          {flagged.map((it) => (
            <div className="item" key={it.id}>
              <div className="ic">{(it.title || it.username || '?').charAt(0).toUpperCase()}</div>
              <div className="info">
                <div className="title-row">
                  <span className="ttl">{it.title || t.noTitle}</span>
                </div>
                <div className="usr" style={{ color: '#e0a13c' }}>
                  {weak.includes(it) ? t.weakLabel : ''}
                  {weak.includes(it) && reused.includes(it) ? ' · ' : ''}
                  {reused.includes(it) ? t.reusedLabel : ''}
                </div>
              </div>
              <div className="acts">
                <button className="iconbtn" title={t.fix} onClick={() => onEdit(it)}>
                  <EditIcon />
                </button>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="empty">{t.allSafe}</div>
      )}

      {m.stale.length > 0 && (
        <>
          <p className="sec-hint" style={{ marginTop: 18 }}>{t.staleTitle}</p>
          {m.stale.map((it) => (
            <div className="item" key={it.id}>
              <div className="ic">{(it.title || it.username || '?').charAt(0).toUpperCase()}</div>
              <div className="info">
                <div className="title-row">
                  <span className="ttl">{it.title || t.noTitle}</span>
                </div>
                <div className="usr" style={{ color: 'var(--muted)' }}>
                  {t.stalePrefix} {timeAgo(it.passwordUpdatedAt || it.updatedAt, t)} {t.staleSuffix}
                </div>
              </div>
              <div className="acts">
                <button className="iconbtn" title={t.changePassword} onClick={() => onEdit(it)}>
                  <EditIcon />
                </button>
              </div>
            </div>
          ))}
        </>
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
  const t = useAppT();
  const [mode, setMode] = useState<'random' | 'phrase'>('random');
  const [pw, setPw] = useState('');
  const [opts, setOpts] = useState<GenOpts>({ length: 18, lower: true, upper: true, digit: true, symbol: true });
  const [pOpts, setPOpts] = useState<PassphraseOpts>({ words: 6, separator: '-', number: true, capitalize: true });

  const gen = useCallback(() => {
    setPw(mode === 'phrase' ? generatePassphrase(pOpts) : generatePassword(opts));
  }, [mode, opts, pOpts]);
  useEffect(() => { gen(); }, [gen]);

  const bits = mode === 'phrase' ? passphraseEntropy(pOpts) : passwordEntropy(opts);
  const st = strengthFromBits(bits);
  const crack = crackTimeLabel(bits);

  const sel = {
    padding: '6px 9px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--panel-2)', color: 'var(--text)', fontSize: 13, cursor: 'pointer',
  } as const;

  return (
    <div className="wrap">
      <div className="panel-card gen-card">
        <div className="seg" style={{ marginBottom: 16 }}>
          <button className={`seg-btn ${mode === 'random' ? 'on' : ''}`} onClick={() => setMode('random')}>{t.genRandom}</button>
          <button className={`seg-btn ${mode === 'phrase' ? 'on' : ''}`} onClick={() => setMode('phrase')}>{t.genPhrase}</button>
        </div>

        <div className="gen-out">
          <span className="gen-pw">{pw || '—'}</span>
          <button type="button" className="iconbtn" title={t.genRegen} onClick={gen}><RefreshIcon /></button>
        </div>

        {pw && (
          <>
            <div className="strength" style={{ marginTop: 12 }}>
              <div className="strength-bar"><span style={{ width: `${(st.score + 1) * 20}%`, background: st.color }} /></div>
              <span className="strength-label" style={{ color: st.color }}>{st.label}</span>
            </div>
            <div className="gen-meta">
              <span>{t.genCrackPrefix} <b style={{ color: st.color }}>{crack}</b> {t.genCrackSuffix}</span>
              <span className="gen-bits">{bits} {t.genBit}</span>
            </div>
          </>
        )}

        <div className="row2" style={{ marginTop: 14 }}>
          <button type="button" className="btn" style={{ flex: 1 }} onClick={() => pw && onCopy(pw, t.lblPassword)}>{t.genCopy}</button>
          <button type="button" className="btn sec" onClick={gen}>{t.genNew}</button>
        </div>

        <div className="gen-controls">
          {mode === 'random' ? (
            <>
              <label className="gen-slider">
                <span>{t.genLength} <b>{opts.length}</b></span>
                <input type="range" min={8} max={48} value={opts.length}
                  onChange={(e) => setOpts((o) => ({ ...o, length: +e.target.value }))} />
              </label>
              <div className="opts" style={{ marginTop: 6 }}>
                {(['lower', 'upper', 'digit', 'symbol'] as const).map((k) => (
                  <label key={k}>
                    <input type="checkbox" checked={opts[k]} onChange={(e) => setOpts((o) => ({ ...o, [k]: e.target.checked }))} />
                    {genLabel(k, t)}
                  </label>
                ))}
              </div>
            </>
          ) : (
            <>
              <label className="gen-slider">
                <span>{t.genWords} <b>{pOpts.words}</b></span>
                <input type="range" min={3} max={8} value={pOpts.words}
                  onChange={(e) => setPOpts((o) => ({ ...o, words: +e.target.value }))} />
              </label>
              <div className="opts" style={{ marginTop: 6 }}>
                <label><input type="checkbox" checked={pOpts.capitalize} onChange={(e) => setPOpts((o) => ({ ...o, capitalize: e.target.checked }))} />{t.genCapital}</label>
                <label><input type="checkbox" checked={pOpts.number} onChange={(e) => setPOpts((o) => ({ ...o, number: e.target.checked }))} />{t.genDigit}</label>
                <label style={{ gap: 6 }}>{t.genSeparator}
                  <select value={pOpts.separator} onChange={(e) => setPOpts((o) => ({ ...o, separator: e.target.value }))} style={sel}>
                    <option value="-">{t.genSepDash}</option>
                    <option value=".">{t.genSepDot}</option>
                    <option value="_">{t.genSepUnderscore}</option>
                    <option value=" ">{t.genSepSpace}</option>
                  </select>
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="panel-card gen-tips">
        <h3 className="pc-title">{t.genTipsTitle}</h3>
        <ul className="tip-list">
          {t.genTips.map((tip, i) => (
            <li key={i}><span className="tip-dot" />{tip}</li>
          ))}
        </ul>
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
  const t = useAppT();
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
      flash(t.backupDownloaded);
    } catch {
      flash(t.exportFailed);
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
          flash(t.importDiffMaster);
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
      flash(`${n} ${t.importedSuffix}`);
      reload();
    } catch {
      flash(t.backupInvalid);
    }
    setBusy(false);
    e.target.value = '';
  }

  async function exportCsv() {
    setBusy(true);
    try {
      const res = await fetch('/api/vault');
      const { items } = await res.json();
      const rows: { name: string; url: string; username: string; password: string; note: string }[] = [];
      for (const it of items ?? []) {
        if (typeof it.data !== 'string') continue;
        try {
          const f = JSON.parse(await decryptStr(encKey, it.data));
          if ((f.type ?? 'login') !== 'login') continue; // CSV format is for logins
          rows.push({ name: f.title || '', url: f.url || '', username: f.username || '', password: f.password || '', note: f.notes || '' });
        } catch {
          /* skip undecryptable row */
        }
      }
      if (rows.length === 0) {
        flash(t.noLoginToExport);
        setBusy(false);
        return;
      }
      const blob = new Blob([toCsv(rows)], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'myvault-logins.csv';
      a.click();
      URL.revokeObjectURL(url);
      flash(`${rows.length} ${t.csvExportedSuffix}`);
    } catch {
      flash(t.csvExportFailed);
    }
    setBusy(false);
  }

  async function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const logins = csvToLogins(parseCsv(await file.text()));
      if (logins.length === 0) {
        flash(t.noLoginInCsv);
      } else {
        let n = 0;
        for (const l of logins) {
          const fields = { type: 'login', title: l.title, username: l.username, password: l.password, url: l.url, notes: l.notes };
          const data = await encryptStr(encKey, JSON.stringify(fields));
          const res = await fetch('/api/vault', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ data }),
          });
          if (res.ok) n++;
        }
        flash(`${n} ${t.csvImportedSuffix}`);
        reload();
      }
    } catch {
      flash(t.csvInvalid);
    }
    setBusy(false);
    e.target.value = '';
  }

  return (
    <div className="wrap">
      <div className="panel-card">
        <h3 className="pc-title">{t.backupExportTitle}</h3>
        <p className="pc-desc">
          {t.backupExportDesc1a} <b>{t.backupExportDescEnc}</b> {t.backupExportDesc1b}
        </p>
        <button className="btn" disabled={busy} onClick={exportBackup}>
          {busy ? t.backupProcessing : t.backupDownload}
        </button>
      </div>
      <div className="panel-card" style={{ marginTop: 14 }}>
        <h3 className="pc-title">{t.backupImportTitle}</h3>
        <p className="pc-desc">
          {t.backupImportDesc1} <b>{t.backupImportDescMaster}</b>.
        </p>
        <label className="btn sec" style={{ display: 'inline-block', cursor: busy ? 'default' : 'pointer' }}>
          {t.backupChooseFile}
          <input type="file" accept="application/json" style={{ display: 'none' }} onChange={importBackup} disabled={busy} />
        </label>
      </div>
      <div className="panel-card" style={{ marginTop: 14 }}>
        <h3 className="pc-title">{t.csvTitle}</h3>
        <p className="pc-desc">
          {t.csvDesc1} <b>{t.csvDescChrome}</b>{t.csvDesc2}
        </p>
        <div className="row2" style={{ flexWrap: 'wrap' }}>
          <label className="btn sec" style={{ display: 'inline-flex', alignItems: 'center', cursor: busy ? 'default' : 'pointer' }}>
            {t.csvImport}
            <input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={importCsv} disabled={busy} />
          </label>
          <button type="button" className="btn sec" disabled={busy} onClick={exportCsv}>{t.csvExport}</button>
        </div>
        <p className="pc-desc" style={{ marginTop: 12, marginBottom: 0, fontSize: 12.5, color: 'var(--danger)' }}>
          {t.csvWarn}
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── Pengaturan ───────────────────────── */
const THEME_KEYS: ('system' | 'dark' | 'light')[] = ['system', 'dark', 'light'];
const themeLabel = (k: 'system' | 'dark' | 'light', t: AppDict): string =>
  k === 'dark' ? t.themeDark : k === 'light' ? t.themeLight : t.themeSystem;

function SettingsView({
  items,
  keys,
  onLock,
  onDeleteAll,
  themePref,
  onSetTheme,
  flash,
}: {
  items: Item[];
  keys: Keys;
  onLock: () => void;
  onDeleteAll: () => void;
  themePref: 'system' | 'dark' | 'light';
  onSetTheme: (m: 'system' | 'dark' | 'light') => void;
  flash: (m: string) => void;
}) {
  const t = useAppT();
  const [lang, setLang] = useLang();
  const [autolock, setAutolock] = useState('30');
  const [persist, setPersist] = useState(true);
  const [clipclear, setClipclear] = useState('30');
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [bioAvail, setBioAvail] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);

  useEffect(() => {
    setAutolock(localStorage.getItem('vault-autolock') ?? '30');
    setPersist(localStorage.getItem('vault-persist') !== '0');
    setClipclear(localStorage.getItem('vault-clipclear') ?? '30');
    setBioOn(biometricEnabled());
    biometricAvailable().then(setBioAvail);

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setCanInstall(!!getInstallPrompt());
    const onCan = () => setCanInstall(true);
    const onDone = () => { setCanInstall(false); setInstalled(true); };
    window.addEventListener('pwa-installable', onCan);
    window.addEventListener('pwa-installed', onDone);
    return () => {
      window.removeEventListener('pwa-installable', onCan);
      window.removeEventListener('pwa-installed', onDone);
    };
  }, []);

  async function install() {
    const p = getInstallPrompt();
    if (!p) {
      flash(t.installUseBrowserMenu);
      return;
    }
    await p.prompt();
    const { outcome } = await p.userChoice;
    clearInstallPrompt();
    setCanInstall(false);
    if (outcome === 'accepted') flash(t.appInstalled);
  }

  async function toggleBio() {
    if (bioBusy) return;
    if (bioOn) {
      disableBiometric();
      setBioOn(false);
      flash(t.bioDisabled);
      return;
    }
    setBioBusy(true);
    try {
      const email = localStorage.getItem('vault-email') || '';
      if (!email) {
        flash(t.bioReloginFirst);
        return;
      }
      await enableBiometric(keys, email);
      setBioOn(true);
      flash(t.bioActive);
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : t.bioEnableFailed);
    } finally {
      setBioBusy(false);
    }
  }

  const saveAutolock = (v: string) => { setAutolock(v); localStorage.setItem('vault-autolock', v); flash(t.saved); };
  const saveClip = (v: string) => { setClipclear(v); localStorage.setItem('vault-clipclear', v); flash(t.saved); };
  const togglePersist = () => {
    const next = !persist;
    setPersist(next);
    localStorage.setItem('vault-persist', next ? '1' : '0');
    if (!next) localStorage.removeItem('vault-k'); // stop caching the key now
    flash(t.saved);
  };

  const sel = {
    padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--panel-2)', color: 'var(--text)', fontSize: 14, cursor: 'pointer',
  } as const;

  return (
    <div className="wrap">
      <div className="panel-card">
        <h3 className="pc-title">{t.setAppearance}</h3>
        <div className="kv">
          <span>{t.themeLabel}</span>
          <div className="seg">
            {THEME_KEYS.map((m) => (
              <button key={m} className={`seg-btn ${themePref === m ? 'on' : ''}`} onClick={() => onSetTheme(m)}>
                {themeLabel(m, t)}
              </button>
            ))}
          </div>
        </div>
        <div className="kv">
          <span>{t.languageLabel}</span>
          <div className="seg">
            <button className={`seg-btn ${lang === 'id' ? 'on' : ''}`} onClick={() => setLang('id')}>{t.langIndonesia}</button>
            <button className={`seg-btn ${lang === 'en' ? 'on' : ''}`} onClick={() => setLang('en')}>{t.langEnglish}</button>
          </div>
        </div>
      </div>

      <div className="panel-card" style={{ marginTop: 14 }}>
        <h3 className="pc-title">{t.setApp}</h3>
        <div className="kv">
          <span>
            {t.installTitle}
            <br />
            <small style={{ color: 'var(--muted)' }}>
              {canInstall || installed
                ? t.installHintCan
                : t.installHintIos}
            </small>
          </span>
          {installed ? (
            <span style={{ color: 'var(--ok)', fontWeight: 600, fontSize: 13 }}>{t.installed}</span>
          ) : (
            <button className="btn sec" onClick={install}>{t.install}</button>
          )}
        </div>
      </div>

      <div className="panel-card" style={{ marginTop: 14 }}>
        <h3 className="pc-title">{t.setSecurityPrivacy}</h3>
        {bioAvail && (
          <div className="kv">
            <span>
              {t.bioTitle}
              <br />
              <small style={{ color: 'var(--muted)' }}>
                {t.bioHint}
              </small>
            </span>
            <button
              className={`switch ${bioOn ? 'on' : ''}`}
              onClick={toggleBio}
              disabled={bioBusy}
              aria-label={t.bioAria}
            >
              <span className="knob" />
            </button>
          </div>
        )}
        <div className="kv">
          <span>{t.autolockTitle}</span>
          <select value={autolock} onChange={(e) => saveAutolock(e.target.value)} style={sel}>
            <option value="5">{t.autolock5}</option>
            <option value="15">{t.autolock15}</option>
            <option value="30">{t.autolock30}</option>
            <option value="60">{t.autolock60}</option>
            <option value="0">{t.autolockNever}</option>
          </select>
        </div>
        <div className="kv">
          <span>{t.clipTitle}</span>
          <select value={clipclear} onChange={(e) => saveClip(e.target.value)} style={sel}>
            <option value="15">{t.clip15}</option>
            <option value="30">{t.clip30}</option>
            <option value="60">{t.clip60}</option>
            <option value="0">{t.clipOff}</option>
          </select>
        </div>
        <div className="kv">
          <span>
            {t.persistTitle}
            <br />
            <small style={{ color: 'var(--muted)' }}>{t.persistHint}</small>
          </span>
          <button className={`switch ${persist ? 'on' : ''}`} onClick={togglePersist} aria-label={t.persistAria}>
            <span className="knob" />
          </button>
        </div>
      </div>

      <div className="panel-card" style={{ marginTop: 14 }}>
        <h3 className="pc-title">{t.setVaultInfo}</h3>
        <div className="kv"><span>{t.infoTotal}</span><b>{items.length}</b></div>
        <div className="kv"><span>{t.infoFav}</span><b>{items.filter((i) => i.favorite).length}</b></div>
        <div className="kv"><span>{t.infoWith2fa}</span><b>{items.filter((i) => i.totp).length}</b></div>
        <div className="kv"><span>{t.infoMode}</span><b>{t.infoModeVal}</b></div>
        <div className="kv"><span>{t.infoEncryption}</span><b>{t.infoEncryptionVal}</b></div>
        <button className="btn sec" style={{ marginTop: 16 }} onClick={onLock}>
          {t.lockNow}
        </button>
      </div>

      <div className="panel-card danger" style={{ marginTop: 14 }}>
        <h3 className="pc-title" style={{ color: 'var(--danger)' }}>{t.setDangerZone}</h3>
        <p className="pc-desc">{t.dangerDesc}</p>
        <button className="btn danger" onClick={onDeleteAll}>
          {t.deleteAllBtn}
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── FAQ ───────────────────────── */
function FaqView() {
  const t = useAppT();
  return (
    <div className="wrap">
      <div className="faq">
        <p className="faq-intro">{t.faqIntro}</p>
        {t.faqs.map((f, i) => (
          <details key={i} className="faq-item">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

// Relative time, e.g. "3 hari lalu" / "3 days ago". Runs in the browser.
function timeAgo(iso: string | undefined, t: AppDict): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return t.taJustNow;
  const units: [number, string][] = [
    [60, t.taMinute],
    [3600, t.taHour],
    [86400, t.taDay],
    [2592000, t.taMonth],
    [31536000, t.taYear],
  ];
  let label = t.taMinute, value = Math.floor(diff / 60);
  for (let i = 0; i < units.length; i++) {
    const [sec, name] = units[i];
    const next = units[i + 1];
    if (!next || diff < next[0]) {
      value = Math.floor(diff / sec);
      label = name;
      break;
    }
  }
  return `${value} ${label} ${t.taAgo}`;
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

const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');
const maskCard = (n: string) => {
  const d = onlyDigits(n);
  return d ? `•••• •••• •••• ${d.slice(-4)}` : '';
};
const groupCard = (n: string) => onlyDigits(n).replace(/(.{4})(?=.)/g, '$1 ');

function ItemRow({
  item,
  highlight,
  onCopy,
  onEditItem,
  onDelete,
  onToggleFav,
  onLogin,
  selectMode,
  selected,
  onToggleSelect,
}: {
  item: Item;
  highlight?: string;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
} & RowProps) {
  const t = useAppT();
  const [show, setShow] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const ty = typeOf(item);
  const title = item.title || t.noTitle;
  const href = /^https?:\/\//.test(item.url) ? item.url : `https://${item.url}`;
  const domain = item.url ? item.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : '';
  const favicon = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : '';
  const initial = (item.title || item.username || '?').charAt(0).toUpperCase();

  const cardNumber = item.cardNumber || '';
  const notes = item.notes || '';
  const idNumber = item.idNumber || '';
  // Which types have something worth hiding behind the eye toggle.
  const hasSecret =
    (ty === 'login' && !!item.password) ||
    (ty === 'card' && (!!cardNumber || !!item.cardCvv)) ||
    (ty === 'note' && !!notes) ||
    (ty === 'identity' && !!(item.email || item.phone || item.address || idNumber));

  const idRow = (label: string, value?: string, copyLabel?: string) =>
    value ? (
      <div className="cf-row">
        <span className="cf-label">{label}</span>
        <span className="cf-val">{value}</span>
        <button className="iconbtn" title={t.rowCopy} onClick={() => onCopy(value, copyLabel || label)}>
          <CopyIcon />
        </button>
      </div>
    ) : null;

  return (
    <div
      className={`item ${selectMode ? 'selectable' : ''} ${selected ? 'selected' : ''}`}
      onClick={selectMode ? () => onToggleSelect?.(item.id) : undefined}
    >
      {selectMode && <div className={`sel-check ${selected ? 'on' : ''}`} aria-hidden />}
      <div className={`ic ic-${ty}`}>
        {ty === 'login' && favicon && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={favicon} alt="" width={22} height={22} onError={() => setImgErr(true)} />
        ) : ty === 'login' ? (
          initial
        ) : (
          <span className="ic-emoji">{typeMeta(ty).icon}</span>
        )}
      </div>
      <div className="info">
        <div className="title-row">
          {ty === 'login' && item.url && !selectMode ? (
            <a className="ttl ttl-link" href={href} target="_blank" rel="noreferrer" title={t.rowOpenSite}>
              {hl(title, highlight)} ↗
            </a>
          ) : (
            <span className="ttl">{hl(title, highlight)}</span>
          )}
          {item.category && <span className="cat">{hl(item.category, highlight)}</span>}
          {ty === 'login' && item.password && <StrengthDot pw={item.password} />}
        </div>

        {/* Type-specific subtitle */}
        {ty === 'login' && item.username && <div className="usr">{hl(item.username, highlight)}</div>}
        {ty === 'card' && cardNumber && (
          <div className="usr mono">{show ? groupCard(cardNumber) : maskCard(cardNumber)}</div>
        )}
        {ty === 'card' && item.cardHolder && <div className="usr">{hl(item.cardHolder, highlight)}</div>}
        {ty === 'note' && notes && <div className={`usr ${show ? '' : 'note-preview'}`}>{notes.split('\n')[0]}</div>}
        {ty === 'identity' && (item.fullName || idNumber) && (
          <div className="usr">
            {hl(item.fullName || '', highlight)}
            {item.fullName && idNumber ? ' · ' : ''}
            {idNumber}
          </div>
        )}

        {ty === 'login' && item.totp && <TotpBadge secret={item.totp} onCopy={onCopy} />}

        {/* Expanded details */}
        {show && ty === 'login' && item.password && <div className="pw">{item.password}</div>}
        {show && ty === 'card' && (
          <>
            {idRow(t.idRowExp, item.cardExpiry, t.lblExpiry)}
            {idRow(t.idRowCvv, item.cardCvv)}
          </>
        )}
        {show && ty === 'identity' && (
          <>
            {idRow(t.idRowEmail, item.email)}
            {idRow(t.idRowPhone, item.phone)}
            {idRow(t.idRowAddress, item.address)}
          </>
        )}
        {show &&
          (item.customFields ?? [])
            .filter((c) => c.label || c.value)
            .map((c, i) => (
              <div className="cf-row" key={i}>
                <span className="cf-label">{c.label || t.lblField}</span>
                <span className="cf-val">{c.value}</span>
                {c.value && (
                  <button className="iconbtn" title={t.rowCopy} onClick={() => onCopy(c.value, c.label || t.lblField)}>
                    <CopyIcon />
                  </button>
                )}
              </div>
            ))}
        {show && notes && <div className="note-row">{notes}</div>}
      </div>
      {!selectMode && (
      <div className="acts">
        {ty === 'login' && onLogin && item.url && item.password && (
          <button className="iconbtn go" title={t.rowLoginGuided} onClick={() => onLogin(item)}>
            <LoginIcon />
          </button>
        )}
        <button
          className={`iconbtn ${item.favorite ? 'fav' : ''}`}
          title={item.favorite ? t.rowUnfav : t.rowFav}
          onClick={() => onToggleFav(item)}
        >
          <StarIcon filled={item.favorite} />
        </button>
        {ty === 'login' && item.username && (
          <button className="iconbtn" title={t.rowCopyUsername} onClick={() => onCopy(item.username, t.lblUsername)}>
            <UserIcon />
          </button>
        )}
        {ty === 'login' && item.password && (
          <button className="iconbtn primary" title={t.rowCopyPassword} onClick={() => onCopy(item.password, t.lblPassword)}>
            <CopyIcon />
          </button>
        )}
        {ty === 'card' && cardNumber && (
          <button className="iconbtn primary" title={t.rowCopyCardNumber} onClick={() => onCopy(onlyDigits(cardNumber), t.lblCardNumber)}>
            <CopyIcon />
          </button>
        )}
        {ty === 'note' && notes && (
          <button className="iconbtn primary" title={t.rowCopyNotes} onClick={() => onCopy(notes, t.lblNotes)}>
            <CopyIcon />
          </button>
        )}
        {ty === 'identity' && idNumber && (
          <button className="iconbtn primary" title={t.rowCopyIdNumber} onClick={() => onCopy(idNumber, t.lblIdNumber)}>
            <CopyIcon />
          </button>
        )}
        {hasSecret && (
          <button className="iconbtn" title={show ? t.rowHide : t.rowShowDetail} onClick={() => setShow((s) => !s)}>
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
        {ty === 'login' && item.url && (
          <a className="iconbtn" title={t.rowOpenSite} href={href} target="_blank" rel="noreferrer">
            <LinkIcon />
          </a>
        )}
        <button className="iconbtn" title={t.rowEdit} onClick={() => onEditItem(item)}>
          <EditIcon />
        </button>
        <button className="iconbtn danger" title={t.rowDelete} onClick={() => onDelete(item)}>
          <TrashIcon />
        </button>
      </div>
      )}
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
function LoginIcon() { return <svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="m10 17 5-5-5-5" /><path d="M15 12H3" /></svg>; }
function RefreshIcon() { return <svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>; }

/* ─────────────────── "Buka & login" terpandu ─────────────────── */
// A floating bar that walks the user through a 2-step login on mobile: it can't
// autofill another site (same-origin policy), but it CAN sequence the copies and
// open the tab, so the user never has to leave the flow to hunt for a field.
function LoginFlowBar({
  item,
  step,
  onCopyPw,
  onReopen,
  onClose,
}: {
  item: Item;
  step: 'opened' | 'ready' | 'done';
  onCopyPw: () => void;
  onReopen: () => void;
  onClose: () => void;
}) {
  const t = useAppT();
  const [imgErr, setImgErr] = useState(false);
  const initial = (item.title || item.username || '?').charAt(0).toUpperCase();
  const domain = item.url ? item.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : '';
  const favicon = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : '';
  const msg =
    step === 'done'
      ? t.lfDone
      : step === 'ready'
      ? t.lfReady
      : t.lfOpened;

  return (
    <div className={`loginbar ${step}`}>
      <div className="lb-ic">
        {favicon && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={favicon} alt="" width={22} height={22} onError={() => setImgErr(true)} />
        ) : (
          initial
        )}
      </div>
      <div className="lb-info">
        <div className="lb-title">{item.title || t.noTitle}</div>
        <div className="lb-step">{msg}</div>
      </div>
      <div className="lb-acts">
        {step !== 'done' && (
          <>
            <button className="btn sm" onClick={onCopyPw}>{t.lfCopyPw}</button>
            <button className="btn ghost sm" title={t.lfReopen} onClick={onReopen}>↗</button>
          </>
        )}
        <button className="iconbtn" title={t.done} onClick={onClose}>✕</button>
      </div>
    </div>
  );
}

// Small coloured dot showing the password's strength.
function StrengthDot({ pw }: { pw: string }) {
  const t = useAppT();
  const s = strength(pw);
  return <span className="str-dot" title={`${t.strengthDotPrefix} ${s.label}`} style={{ background: s.color, color: s.color }} />;
}

// Rotating 2FA code with a 30s countdown ring; click to copy.
function TotpBadge({ secret, onCopy }: { secret: string; onCopy: (t: string, l: string) => void }) {
  const tr = useAppT();
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
    <button type="button" className="totp" title={tr.totpTitle} onClick={() => valid && onCopy(code, tr.lblTotpCode)}>
      <span className="totp-ring" style={{ ['--p']: `${(left / 30) * 100}%` } as React.CSSProperties} />
      <span className="totp-code">{display}</span>
      <span className="totp-left">{left}s</span>
    </button>
  );
}

const genLabel = (k: 'lower' | 'upper' | 'digit' | 'symbol', t: AppDict): string =>
  k === 'upper' ? t.genLblUpper : k === 'digit' ? t.genLblDigit : k === 'symbol' ? t.genLblSymbol : t.genLblLower;

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
  const t = useAppT();
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
    // Stamp the password-change time only when the password actually changed, so
    // the "password lama" reminder tracks rotation — not favorites or title edits.
    const pwChanged = !!f.password && f.password !== initial.password;
    const toSave = pwChanged ? { ...f, passwordUpdatedAt: new Date().toISOString() } : f;
    const ok = await onSave(toSave, id);
    // On success the modal unmounts; on failure keep it open + re-enable Simpan.
    if (!ok) setBusy(false);
  }

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{id ? t.modalEditTitle : t.modalNewTitle}</h2>
        <form onSubmit={submit}>
          <label className="fld">{t.fldType}</label>
          <div className="seg type-seg" style={{ marginBottom: 14 }}>
            {ITEM_TYPES.map((it) => (
              <button
                key={it.key}
                type="button"
                className={`seg-btn ${typeOf(f) === it.key ? 'on' : ''}`}
                onClick={() => setF((p) => ({ ...p, type: it.key }))}
              >
                {it.icon} {typeLabel(it.key, t)}
              </button>
            ))}
          </div>

          <label className="fld">{t.fldTitle}</label>
          <input
            className="input"
            autoFocus
            required
            value={f.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder={
              typeOf(f) === 'card' ? 'Kartu BCA' : typeOf(f) === 'note' ? 'Catatan WiFi' : typeOf(f) === 'identity' ? 'KTP' : 'Facebook'
            }
          />

          {typeOf(f) === 'login' && (
            <>
              <label className="fld">{t.fldUsername}</label>
              <input className="input" value={f.username} onChange={(e) => set('username', e.target.value)} placeholder="kamu@email.com" />

              <label className="fld">{t.fldPassword}</label>
              <div className="row2">
                <input className="input" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" />
                <button type="button" className="btn sec" onClick={() => setShowGen((s) => !s)}>⚙</button>
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
                    <button type="button" className="btn" onClick={() => set('password', generatePassword(opts))}>{t.genCreate}</button>
                  </div>
                  <div className="opts">
                    <label>
                      {t.genLenShort}
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
                        {genLabel(k, t)}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <label className="fld">{t.fldWebsite}</label>
              <input className="input" value={f.url} onChange={(e) => set('url', e.target.value)} placeholder="facebook.com" />

              <label className="fld">{t.fldTotp}</label>
              <input
                className="input"
                value={f.totp ?? ''}
                onChange={(e) => set('totp', e.target.value)}
                placeholder={t.fldTotpPlaceholder}
                style={{ fontFamily: 'ui-monospace, monospace' }}
              />
            </>
          )}

          {typeOf(f) === 'card' && (
            <>
              <label className="fld">{t.fldCardHolder}</label>
              <input className="input" value={f.cardHolder ?? ''} onChange={(e) => set('cardHolder', e.target.value)} placeholder="NAMA LENGKAP" />

              <label className="fld">{t.fldCardNumber}</label>
              <input
                className="input"
                value={f.cardNumber ?? ''}
                onChange={(e) => set('cardNumber', e.target.value)}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                style={{ fontFamily: 'ui-monospace, monospace' }}
              />

              <div className="row2">
                <div style={{ flex: 1 }}>
                  <label className="fld">{t.fldCardExpiry}</label>
                  <input className="input" style={{ marginBottom: 0 }} value={f.cardExpiry ?? ''} onChange={(e) => set('cardExpiry', e.target.value)} placeholder="MM/YY" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="fld">{t.fldCvv}</label>
                  <input className="input" style={{ marginBottom: 0 }} value={f.cardCvv ?? ''} onChange={(e) => set('cardCvv', e.target.value)} placeholder="123" inputMode="numeric" />
                </div>
              </div>
            </>
          )}

          {typeOf(f) === 'identity' && (
            <>
              <label className="fld">{t.fldFullName}</label>
              <input className="input" value={f.fullName ?? ''} onChange={(e) => set('fullName', e.target.value)} placeholder={t.fldFullNamePlaceholder} />

              <label className="fld">{t.fldIdNumber}</label>
              <input
                className="input"
                value={f.idNumber ?? ''}
                onChange={(e) => set('idNumber', e.target.value)}
                placeholder="3201xxxxxxxxxxxx"
                style={{ fontFamily: 'ui-monospace, monospace' }}
              />

              <label className="fld">{t.fldEmail}</label>
              <input className="input" value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="kamu@email.com" />

              <label className="fld">{t.fldPhone}</label>
              <input className="input" value={f.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="08xxxxxxxxxx" />

              <label className="fld">{t.fldAddress}</label>
              <textarea className="input" rows={2} value={f.address ?? ''} onChange={(e) => set('address', e.target.value)} style={{ resize: 'vertical' }} />
            </>
          )}

          <label className="fld">{t.fldCategory}</label>
          <input className="input" value={f.category} onChange={(e) => set('category', e.target.value)} placeholder="Sosial" />

          <label className="fld">{t.fldNotes}</label>
          <textarea className="input" rows={typeOf(f) === 'note' ? 6 : 3} value={f.notes} onChange={(e) => set('notes', e.target.value)} style={{ resize: 'vertical' }} />

          <label className="fld">{t.fldCustom}</label>
          {(f.customFields ?? []).map((field, i) => (
            <div className="row2" key={i} style={{ marginBottom: 8 }}>
              <input
                className="input" style={{ marginBottom: 0, flex: '0 0 34%' }} placeholder={t.customLabel}
                value={field.label}
                onChange={(e) => setF((p) => ({ ...p, customFields: (p.customFields ?? []).map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))}
              />
              <input
                className="input" style={{ marginBottom: 0 }} placeholder={t.customValue}
                value={field.value}
                onChange={(e) => setF((p) => ({ ...p, customFields: (p.customFields ?? []).map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) }))}
              />
              <button
                type="button" className="btn ghost" title={t.removeField}
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
            {t.addField}
          </button>

          {meta?.updatedAt && (
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '14px 0 0', textAlign: 'right' }}>
              {t.metaUpdated} {timeAgo(meta.updatedAt, t)}
              {meta.createdAt ? ` ${t.metaCreatedPrefix} ${timeAgo(meta.createdAt, t)}` : ''}
            </p>
          )}
          <div className="modal-acts">
            <button type="button" className="btn ghost" onClick={onClose}>
              {t.cancel}
            </button>
            <button className="btn" disabled={busy}>
              {busy ? t.saving : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
