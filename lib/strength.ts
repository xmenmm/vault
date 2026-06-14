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
