import { NextRequest, NextResponse } from 'next/server';
import { createAnonymousToken } from '@/lib/commerce/auth/service';
import { createAuthTokenStore } from '@/lib/commerce/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = (await request.json().catch(() => ({}))) as { buyerId?: string };
    const token = await createAnonymousToken(payload.buyerId);

    const store = createAuthTokenStore();
    await store.write(token.access_token, token.expires_in);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create anonymous token';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
