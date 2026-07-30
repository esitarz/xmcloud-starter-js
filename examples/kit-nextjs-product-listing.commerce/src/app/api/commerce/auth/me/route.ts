import { NextResponse } from 'next/server';
import { createAuthTokenStore } from '@/lib/commerce/auth/session';
import { getMe } from '@/lib/commerce/auth/service';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const store = createAuthTokenStore();
    const token = await store.read();

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const me = await getMe(token);
    return NextResponse.json({ ok: true, me });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load profile';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
