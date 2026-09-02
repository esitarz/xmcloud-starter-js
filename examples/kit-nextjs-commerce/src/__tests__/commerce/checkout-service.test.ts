import { getCheckoutStatus, startCheckout } from '@/lib/commerce/checkout/service';
import { CheckoutServiceError } from '@/lib/commerce/checkout/types';

const serviceUrl = 'https://checkout.example.test/';

const mockFetch = (body: unknown, status: number): jest.MockedFunction<typeof fetch> => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);

  Object.defineProperty(global, 'fetch', {
    configurable: true,
    value: fetchMock,
  });

  return fetchMock;
};

describe('checkout service adapter', () => {
  const originalServiceUrl = process.env.CHECKOUT_SERVICE_URL;

  beforeEach(() => {
    process.env.CHECKOUT_SERVICE_URL = serviceUrl;
  });

  afterEach(() => {
    if (originalServiceUrl === undefined) {
      delete process.env.CHECKOUT_SERVICE_URL;
    } else {
      process.env.CHECKOUT_SERVICE_URL = originalServiceUrl;
    }

    jest.restoreAllMocks();
    Reflect.deleteProperty(global, 'fetch');
  });

  test('starts checkout with opaque order ID and shopper token', async () => {
    const fetchMock = mockFetch(
      { attemptId: 'attempt-1', redirectUrl: 'https://checkout.stripe.test/c/1' },
      201
    );

    await expect(startCheckout({ orderId: 'order-1' }, 'shopper-token')).resolves.toEqual({
      attemptId: 'attempt-1',
      redirectUrl: 'https://checkout.stripe.test/c/1',
    });

    expect(fetchMock).toHaveBeenCalledWith('https://checkout.example.test/checkout/attempts', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer shopper-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId: 'order-1' }),
      cache: 'no-store',
    });
  });

  test('reads checkout status using the opaque attempt ID', async () => {
    const fetchMock = mockFetch(
      { attemptId: 'attempt-1', status: 'pending', orderId: 'order-1' },
      200
    );

    await expect(getCheckoutStatus('attempt/1', 'shopper-token')).resolves.toEqual({
      attemptId: 'attempt-1',
      status: 'pending',
      orderId: 'order-1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://checkout.example.test/checkout/attempts/attempt%2F1',
      {
        headers: {
          Authorization: 'Bearer shopper-token',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );
  });

  test('preserves checkout service errors without exposing a response body', async () => {
    mockFetch({ error: 'Order is not currently calculated' }, 409);

    await expect(startCheckout({ orderId: 'order-1' }, 'shopper-token')).rejects.toEqual(
      new CheckoutServiceError('Order is not currently calculated', 409)
    );
  });
});
