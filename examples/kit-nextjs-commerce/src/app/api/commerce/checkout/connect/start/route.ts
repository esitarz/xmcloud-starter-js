import { NextRequest, NextResponse } from 'next/server';
import { createAuthTokenStore } from '@/lib/commerce/auth/session';
import { getCart } from '@/lib/commerce/cart/service';
import { createConnectedCheckoutSession } from '@/lib/commerce/checkout/connect';

export const dynamic = 'force-dynamic';

const isSameOriginRequest = (request: NextRequest): boolean => {
  const origin = request.headers.get('origin');
  return !!origin && origin === request.nextUrl.origin;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const shopperToken = await createAuthTokenStore().read();
  if (!shopperToken) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const cart = await getCart(shopperToken);
    const checkout = await createConnectedCheckoutSession(cart);
    return NextResponse.json(
      {
        attemptId: checkout.sessionId,
        redirectUrl: checkout.url,
        connectedAccountId: checkout.connectedAccountId,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start Connect checkout';
    const status = message.startsWith('Missing required checkout configuration') ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
