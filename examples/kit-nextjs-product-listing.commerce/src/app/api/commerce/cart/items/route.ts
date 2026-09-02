import { NextRequest, NextResponse } from 'next/server';
import { createAuthTokenStore } from '@/lib/commerce/auth/session';
import { addCartItem } from '@/lib/commerce/cart/service';

export const dynamic = 'force-dynamic';

const isSameOriginRequest = (request: NextRequest): boolean =>
  request.headers.get('origin') === request.nextUrl.origin;

const isValidId = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 128;

const isValidQuantity = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 999;

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (
    !isValidId(payload?.orderId) ||
    !isValidId(payload?.productId) ||
    !isValidQuantity(payload?.quantity)
  ) {
    return NextResponse.json(
      { error: 'orderId, productId, and quantity are required' },
      { status: 400 }
    );
  }

  const shopperToken = await createAuthTokenStore().read();

  if (!shopperToken) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    await addCartItem(
      {
        orderId: payload.orderId.trim(),
        productId: payload.productId.trim(),
        quantity: payload.quantity,
      },
      shopperToken
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to add cart item';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
