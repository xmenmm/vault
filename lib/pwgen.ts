// Cryptographically-strong password generator (browser).
const SETS = {
  lower: 'abcdefghijkmnpqrstuvwxyz',
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  digit: '23456789',
  symbol: '!@#$%^&*()-_=+[]{}',
};

export type GenOpts = {
  length: number;
  lower: boolean;
  upper: boolean;
  digit: boolean;
  symbol: boolean;
};

export function generatePassword(opts: GenOpts): string {
  let pool = '';
  if (opts.lower) pool += SETS.lower;
  if (opts.upper) pool += SETS.upper;
  if (opts.digit) pool += SETS.digit;
  if (opts.symbol) pool += SETS.symbol;
  if (!pool) pool = SETS.lower + SETS.upper + SETS.digit;

  const out: string[] = [];
  const rnd = new Uint32Array(opts.length);
  crypto.getRandomValues(rnd);
  for (let i = 0; i < opts.length; i++) {
    out.push(pool[rnd[i] % pool.length]);
  }
  return out.join('');
}

// Word-based passphrases — easier to type/remember, still strong when long.
// Short, common, unambiguous words. Wrapped in a Set so any accidental
// duplicate is dropped (a dup would quietly weaken the entropy estimate).
export const PASSPHRASE_WORDS = [...new Set([
  // Indonesian
  'apel', 'batu', 'cahaya', 'daun', 'embun', 'fajar', 'gunung', 'hujan',
  'ikan', 'jalan', 'kapal', 'langit', 'macan', 'nada', 'ombak', 'padi',
  'roda', 'sungai', 'ungu', 'waktu', 'yoga', 'zebra', 'angin', 'bunga',
  'cinta', 'dunia', 'emas', 'foto', 'gajah', 'hutan', 'istana', 'jagung',
  'kelapa', 'lebah', 'mawar', 'naga', 'pantai', 'rumah', 'salju', 'tanah',
  'udara', 'warna', 'awan', 'beruang', 'cabai', 'elang', 'garuda', 'harimau',
  'intan', 'jambu', 'koala', 'merah', 'nanas', 'palem', 'rusa', 'semut',
  'tupai', 'vila', 'zaman', 'biru', 'hijau', 'kuning', 'putih', 'hitam',
  'bintang', 'bulan', 'laut', 'danau', 'lembah', 'badai', 'pelangi', 'kabut',
  'petir', 'mutiara', 'permata', 'sutra', 'baja', 'tembaga', 'perak', 'kristal',
  // English
  'mango', 'river', 'cloud', 'stone', 'eagle', 'ocean', 'forest', 'maple',
  'comet', 'lemon', 'piano', 'robot', 'solar', 'amber', 'coral', 'frost',
  'glide', 'honey', 'ivory', 'jolly', 'lunar', 'noble', 'olive', 'pearl',
  'quill', 'raven', 'spark', 'tulip', 'vivid', 'whale', 'azure', 'brave',
  'crisp', 'ember', 'fable', 'grove', 'haven', 'jewel', 'karma', 'lotus',
  'misty', 'north', 'opal', 'plume', 'reef', 'storm', 'thorn', 'velvet',
  'wave', 'blaze', 'cedar', 'dawn', 'fern', 'glow', 'meteor', 'nebula',
  'pixel', 'quasar', 'ripple', 'summit', 'vortex', 'willow', 'falcon', 'panther',
  'marble', 'copper', 'silver', 'golden', 'shadow', 'thunder', 'breeze', 'canyon',
  'harbor', 'island', 'jungle', 'meadow', 'valley', 'glacier', 'prairie', 'orchid',
])];

export type PassphraseOpts = {
  words: number;
  separator: string;
  number: boolean;
  capitalize: boolean;
};

function pick<T>(arr: T[], rnd: number): T {
  return arr[rnd % arr.length];
}

export function generatePassphrase(opts: PassphraseOpts): string {
  const n = Math.max(2, Math.min(10, opts.words));
  const rnd = new Uint32Array(n + 1);
  crypto.getRandomValues(rnd);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    let w = pick(PASSPHRASE_WORDS, rnd[i]);
    if (opts.capitalize) w = w.charAt(0).toUpperCase() + w.slice(1);
    parts.push(w);
  }
  let out = parts.join(opts.separator || '-');
  if (opts.number) out += (opts.separator || '-') + (rnd[n] % 90 + 10); // 10–99
  return out;
}

// Entropy of a passphrase: words × log2(wordlist) + bits added by a number.
export function passphraseEntropy(opts: PassphraseOpts): number {
  const n = Math.max(2, Math.min(10, opts.words));
  let bits = n * Math.log2(PASSPHRASE_WORDS.length);
  if (opts.number) bits += Math.log2(90);
  return Math.round(bits);
}
