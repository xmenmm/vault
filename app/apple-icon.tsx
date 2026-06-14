import { lockIcon } from '@/lib/app-icon';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return lockIcon(180);
}
