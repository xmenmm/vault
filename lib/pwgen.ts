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
