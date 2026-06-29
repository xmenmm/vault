// Minimal RFC-4180-ish CSV parser (browser). Handles quoted fields, escaped
// quotes (""), and newlines inside quotes — enough for password-manager exports
// (Chrome, Firefox, Bitwarden, LastPass, 1Password, …).

export function parseCsv(text: string): string[][] {
  const s = text.replace(/\r\n?/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }

  // Drop fully-empty rows (trailing newline, blank lines).
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

// Quote a CSV field when it contains a comma, quote, or newline (RFC 4180).
function csvField(v: string): string {
  const s = v ?? '';
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Build a Chrome-compatible CSV (so it can be re-imported anywhere) from rows.
export function toCsv(rows: { name: string; url: string; username: string; password: string; note: string }[]): string {
  const header = 'name,url,username,password,note';
  const body = rows.map((r) => [r.name, r.url, r.username, r.password, r.note].map(csvField).join(','));
  return [header, ...body].join('\n');
}

export type CsvLogin = { title: string; username: string; password: string; url: string; notes: string };

// Map a parsed CSV (with header row) to login fields, matching common column
// names across the major exporters.
export function csvToLogins(rows: string[][]): CsvLogin[] {
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  // Resolve by synonym precedence (earlier names win), not by header position —
  // so a real "username" column is preferred over an "email" column even if
  // email appears first, and the two never collide on the same slot.
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };

  const ti = col('name', 'title', 'judul', 'account');
  const ui = col('username', 'user', 'login', 'login_username', 'login_uri_username');
  const emailI = col('email', 'e-mail');
  const pi = col('password', 'pass', 'pwd', 'login_password');
  const urli = col('url', 'website', 'web', 'site', 'login_uri', 'uri', 'hostname');
  const ni = col('note', 'notes', 'catatan', 'comment', 'comments', 'extra');

  const out: CsvLogin[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : '');
    const username = get(ui) || get(emailI); // prefer username, fall back to email
    const password = get(pi);
    const url = get(urli);
    const title = get(ti) || url || username;
    if (!title && !username && !password) continue; // skip junk rows
    // Leave title empty if there's nothing — the UI renders a localized
    // "(no title)" at display time, so no language leaks into stored data.
    out.push({ title, username, password, url, notes: get(ni) });
  }
  return out;
}
