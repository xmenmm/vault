// Breach check against HaveIBeenPwned's "Pwned Passwords" range API, using
// k-anonymity: the password is hashed with SHA-1 locally and only the first 5
// hex chars of the hash are ever sent. The API returns every hash suffix that
// shares that prefix, and we match the rest on-device — so the password itself
// (and its full hash) never leave the browser.

async function sha1Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

// Returns how many times the password appears in known breaches (0 = not found).
export async function pwnedCount(password: string): Promise<number> {
  if (!password) return 0;
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  // "Add-Padding" asks HIBP to pad the response with decoy entries, so the
  // response size can't hint at how many matches the prefix really had.
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'Add-Padding': 'true' },
  });
  if (!res.ok) throw new Error(`HIBP lookup failed (${res.status})`);

  const text = await res.text();
  for (const line of text.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    if (line.slice(0, idx).trim().toUpperCase() === suffix) {
      return parseInt(line.slice(idx + 1).trim(), 10) || 0;
    }
  }
  return 0;
}
