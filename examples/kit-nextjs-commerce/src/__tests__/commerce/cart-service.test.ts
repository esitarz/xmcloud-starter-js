import { CartService } from '@/lib/commerce/cart/service';
import type { CommerceRequest } from '@/lib/commerce/client';

describe('cart service', () => {
  const request = jest.fn() as jest.MockedFunction<CommerceRequest>;
  const cart = new CartService(request);

  beforeEach(() => request.mockReset());

  test('reads and maps the current cart through the authenticated proxy client', async () => {
    request.mockResolvedValue({
      ID: 'order-1',
      Status: 'Unsubmitted',
      Currency: 'USD',
      Subtotal: 24.5,
      TaxCost: 2.45,
      Total: 26.95,
      IsCalculated: true,
    });

    await expect(cart.get()).resolves.toEqual({
      id: 'order-1',
      status: 'Unsubmitted',
      currency: 'USD',
      subtotal: 24.5,
      taxCost: 2.45,
      total: 26.95,
      isCalculated: true,
    });
    expect(request).toHaveBeenCalledWith('/v1/cart');
  });

  test('rejects non-cart OrderCloud responses', async () => {
    request.mockResolvedValue({ ID: 'order-1', Status: 'Submitted' });
    await expect(cart.get()).rejects.toThrow(
      'OrderCloud cart response was not an unsubmitted order'
    );
  });

  test('maps a cart that has not yet been assigned an order ID', async () => {
    request.mockResolvedValue({ ID: null, Status: null });

    await expect(cart.get()).resolves.toEqual({
      status: 'Unsubmitted',
      isCalculated: false,
    });
  });

  test('adds a product through a buyer-scoped proxy path', async () => {
    request.mockResolvedValue(undefined);
    await cart.addItem({ productId: 'product-1', quantity: 2 });

    expect(request).toHaveBeenCalledWith('/v1/cart/lineitems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ProductID: 'product-1', Quantity: 2 }),
    });
  });

  test('updates and removes a line item through buyer-scoped proxy paths', async () => {
    request.mockResolvedValue(undefined);
    await cart.updateItem({
      lineItemId: 'line/1',
      quantity: 3,
    });
    await cart.removeItem('line/1');

    expect(request).toHaveBeenNthCalledWith(1, '/v1/cart/lineitems/line%2F1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Quantity: 3 }),
    });
    expect(request).toHaveBeenNthCalledWith(2, '/v1/cart/lineitems/line%2F1', {
      method: 'DELETE',
      headers: undefined,
      body: undefined,
    });
  });
});
