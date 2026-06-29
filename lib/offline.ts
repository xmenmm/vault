// Offline cache of the encrypted vault rows in IndexedDB, so the vault opens
// and reads even with no connection. Only ciphertext is cached — the same thing
// the server stores — so nothing readable is added to the device. Mutations
// still require a connection; this is offline READ.

export type VaultRow = { id: string; data: string; created_at?: string; updated_at?: string };

const DB_NAME = 'myvault';
const STORE = 'rows';
const KEY = 'vault-rows';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRows(rows: VaultRow[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(rows, KEY);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    /* IndexedDB unavailable — offline cache is best-effort */
  }
}

export async function loadRows(): Promise<VaultRow[] | null> {
  try {
    const db = await openDb();
    const rows = await new Promise<VaultRow[] | null>((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => res((req.result as VaultRow[]) ?? null);
      req.onerror = () => rej(req.error);
    });
    db.close();
    return rows;
  } catch {
    return null;
  }
}

export async function clearRows(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((res) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => res();
      tx.onerror = () => res();
    });
    db.close();
  } catch {
    /* ignore */
  }
}
