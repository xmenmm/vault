// Simple password strength estimate (browser/client).
export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; color: string };

export function strength(pw: string): Strength {
  if (!pw) return { score: 0, label: '', color: '#e0503c' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (pw.length >= 16) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  const score = Math.min(4, Math.floor((s * 4) / 6)) as 0 | 1 | 2 | 3 | 4;
  const labels = ['Sangat lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat kuat'];
  const colors = ['#e0503c', '#e0834c', '#e0a13c', '#7bbf4c', '#2bb079'];
  return { score, label: labels[score], color: colors[score] };
}

// Strength derived from raw entropy (bits) — used by the generator so the bar,
// label, and crack-time all tell the same story. Thresholds tuned for a fast
// offline attacker (matches crackTimeLabel's assumption).
export function strengthFromBits(bits: number): Strength {
  let score: 0 | 1 | 2 | 3 | 4;
  if (bits < 30) score = 0;
  else if (bits < 45) score = 1;
  else if (bits < 60) score = 2;
  else if (bits < 80) score = 3;
  else score = 4;
  const labels = ['Sangat lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat kuat'];
  const colors = ['#e0503c', '#e0834c', '#e0a13c', '#7bbf4c', '#2bb079'];
  return { score, label: labels[score], color: colors[score] };
}

// Size of the character pool a password appears to be drawn from.
export function poolSize(pw: string): number {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/\d/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 32;
  return pool || 1;
}

// Rough entropy in bits: length × log2(poolSize). Good enough for a UI hint.
export function entropyBits(pw: string): number {
  if (!pw) return 0;
  return Math.round(pw.length * Math.log2(poolSize(pw)));
}

// Localized unit words for crackTimeLabel (passed in from the dictionary).
export type CrackUnits = {
  instant: string; sec: string; min: string; hr: string; day: string; mon: string; yr: string;
  century: string; thousandsC: string; millionsC: string;
};

// Human-readable "time to crack" for a given entropy, assuming a fast offline
// attacker at 1e11 guesses/sec and half the keyspace searched on average.
export function crackTimeLabel(bits: number, u: CrackUnits): string {
  if (bits <= 0) return u.instant;
  const seconds = Math.pow(2, bits) / 2 / 1e11;
  if (seconds < 1) return u.instant;

  const YEAR = 31536000;
  if (seconds >= YEAR * 100) {
    const centuries = seconds / (YEAR * 100);
    if (centuries >= 1e6) return u.millionsC;
    if (centuries >= 1000) return u.thousandsC;
    return `${Math.round(centuries)} ${u.century}`;
  }
  // [secondsPerUnit, name], ascending — pick the largest unit that fits.
  const units: [number, string][] = [
    [1, u.sec],
    [60, u.min],
    [3600, u.hr],
    [86400, u.day],
    [2592000, u.mon],
    [YEAR, u.yr],
  ];
  for (let i = units.length - 1; i >= 0; i--) {
    const [sec, name] = units[i];
    if (seconds >= sec) return `${Math.max(1, Math.round(seconds / sec))} ${name}`;
  }
  return u.instant;
}
