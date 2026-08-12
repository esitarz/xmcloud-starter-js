import { NextResponse } from 'next/server';
import { createAuthTokenStore } from '@/lib/commerce/auth/session';
import { getCart } from '@/lib/commerce/cart/service';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const shopperToken = await createAuthTokenStore().read();

  if (!shopperToken) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    return NextResponse.json(await getCart(shopperToken));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load cart';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
