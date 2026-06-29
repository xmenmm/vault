import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

// The signed-in user's id (from the session cookie), or null.
export async function currentUserId(): Promise<string | null> {
  const c = await cookies();
  return verifySession(c.get(SESSION_COOKIE)?.value);
}
