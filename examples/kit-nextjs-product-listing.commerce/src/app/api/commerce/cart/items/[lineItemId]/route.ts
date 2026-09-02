import { NextRequest, NextResponse } from 'next/server';
import { createAuthTokenStore } from '@/lib/commerce/auth/session';
import { removeCartItem, updateCartItem } from '@/lib/commerce/cart/service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ lineItemId: string }> };

const isSameOriginRequest = (request: NextRequest): boolean =>
  request.headers.get('origin') === request.nextUrl.origin;

const isValidId = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 128;

const isValidQuantity = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 999;

const getShopperToken = async (): Promise<string | NextResponse<{ error: string }>> => {
  const shopperToken = await createAuthTokenStore().read();
  return shopperToken || NextResponse.json({ error: 'Authentication required' }, { status: 401 });
};

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const { lineItemId } = await context.params;
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (
    !isValidId(lineItemId) ||
    !isValidId(payload?.orderId) ||
    !isValidQuantity(payload?.quantity)
  ) {
    return NextResponse.json(
      { error: 'lineItemId, orderId, and quantity are required' },
      { status: 400 }
    );
  }

  const shopperToken = await getShopperToken();
  if (shopperToken instanceof NextResponse) return shopperToken;

  try {
    await updateCartItem(
      {
        orderId: payload.orderId.trim(),
        lineItemId: lineItemId.trim(),
        quantity: payload.quantity,
      },
      shopperToken
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update cart item';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const { lineItemId } = await context.params;
  const orderId = request.nextUrl.searchParams.get('orderId');

  if (!isValidId(lineItemId) || !isValidId(orderId)) {
    return NextResponse.json({ error: 'lineItemId and orderId are required' }, { status: 400 });
  }

  const shopperToken = await getShopperToken();
  if (shopperToken instanceof NextResponse) return shopperToken;

  try {
    await removeCartItem(orderId.trim(), lineItemId.trim(), shopperToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to remove cart item';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
