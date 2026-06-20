import { lockIcon } from '@/lib/app-icon';

// Browser tab favicon. Having this metadata file makes Next emit the
// <link rel="icon"> tags, so browsers stop falling back to a 404 /favicon.ico.
export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return lockIcon(32);
}
