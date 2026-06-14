import { lockIcon } from '@/lib/app-icon';

export const runtime = 'edge';

export function GET() {
  return lockIcon(192);
}
