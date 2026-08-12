jest.mock('@/lib/commerce/dispatcher/service', () => ({
  dispatchToLocalProxy: jest.fn(),
}));

import { dispatchToLocalProxy } from '@/lib/commerce/dispatcher/service';
import { getCart } from '@/lib/commerce/cart/service';

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
});
