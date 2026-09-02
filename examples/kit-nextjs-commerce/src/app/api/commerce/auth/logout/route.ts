import { NextResponse } from 'next/server';
import { createAuthTokenStore } from '@/lib/commerce/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  const store = createAuthTokenStore();
  await store.clear();
  return NextResponse.json({ ok: true });
}
