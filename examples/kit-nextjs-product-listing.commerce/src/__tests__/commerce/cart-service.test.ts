jest.mock('@/lib/commerce/dispatcher/service', () => ({
  dispatchToLocalProxy: jest.fn(),
}));

import { dispatchToLocalProxy } from '@/lib/commerce/dispatcher/service';
import { addCartItem, getCart, removeCartItem, updateCartItem } from '@/lib/commerce/cart/service';

const mockDispatchToLocalProxy = dispatchToLocalProxy as jest.MockedFunction<
  typeof dispatchToLocalProxy
>;

describe('cart service', () => {
  beforeEach(() => {
    mockDispatchToLocalProxy.mockReset();
  });

  test('reads the current cart through the local OrderCloud proxy', async () => {
    mockDispatchToLocalProxy.mockResolvedValue({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ID: 'order-1',
        Status: 'Unsubmitted',
        Currency: 'USD',
        Subtotal: 24.5,
        TaxCost: 2.45,
        Total: 26.95,
        IsCalculated: true,
      }),
    });

    await expect(getCart('shopper-token')).resolves.toEqual({
      id: 'order-1',
      status: 'Unsubmitted',
      currency: 'USD',
      subtotal: 24.5,
      taxCost: 2.45,
      total: 26.95,
      isCalculated: true,
    });

    expect(mockDispatchToLocalProxy).toHaveBeenCalledWith({
      currentRequest: {
        url: 'https://local.test/storefront/v1/me/cart',
        method: 'GET',
        headers: {
          Authorization: 'Bearer shopper-token',
        },
      },
      traceType: 'none',
      currentStep: 'nextjs-cart-read',
    });
  });

  test('rejects non-cart OrderCloud responses', async () => {
    mockDispatchToLocalProxy.mockResolvedValue({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ID: 'order-1', Status: 'Submitted' }),
    });

    await expect(getCart('shopper-token')).rejects.toThrow(
      'OrderCloud cart response was not an unsubmitted order'
    );
  });

  test('includes upstream failure status without leaking response content', async () => {
    mockDispatchToLocalProxy.mockResolvedValue({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ Message: 'token details' }),
    });

    await expect(getCart('shopper-token')).rejects.toThrow(
      'OrderCloud cart request failed with status 401'
    );
  });

  test('adds a product with quantity only through the buyer proxy', async () => {
    mockDispatchToLocalProxy.mockResolvedValue({
      status: 201,
      contentType: 'application/json',
      body: '',
    });

    await addCartItem({ orderId: 'order/1', productId: 'product-1', quantity: 2 }, 'shopper-token');

    expect(mockDispatchToLocalProxy).toHaveBeenCalledWith(
      expect.objectContaining({
        currentRequest: expect.objectContaining({
          url: 'https://local.test/storefront/v1/me/orders/order%2F1/lineitems',
          method: 'POST',
          body: JSON.stringify({ ProductID: 'product-1', Quantity: 2 }),
        }),
      })
    );
  });

  test('updates and removes a line item through buyer-scoped OrderCloud paths', async () => {
    mockDispatchToLocalProxy.mockResolvedValue({
      status: 200,
      contentType: 'application/json',
      body: '',
    });

    await updateCartItem(
      { orderId: 'order-1', lineItemId: 'line/1', quantity: 3 },
      'shopper-token'
    );
    await removeCartItem('order-1', 'line/1', 'shopper-token');

    expect(mockDispatchToLocalProxy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        currentRequest: expect.objectContaining({
          url: 'https://local.test/storefront/v1/me/orders/order-1/lineitems/line%2F1',
          method: 'PATCH',
          body: JSON.stringify({ Quantity: 3 }),
        }),
      })
    );
    expect(mockDispatchToLocalProxy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        currentRequest: expect.objectContaining({
          url: 'https://local.test/storefront/v1/me/orders/order-1/lineitems/line%2F1',
          method: 'DELETE',
        }),
      })
    );
  });
});
