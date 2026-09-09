import { render, screen, waitFor } from '@testing-library/react';
import { StrictMode, useEffect, useState } from 'react';
import { OrderCloudProvider, useOrderCloud } from '@/contexts/OrderCloudContext';
import {
  clearStoredOrderCloudToken,
  writeStoredOrderCloudToken,
} from '@/lib/commerce/auth/token-store';

const originalProxyUrl = process.env.NEXT_PUBLIC_ORDERCLOUD_PROXY_URL;

const Consumer = () => {
  const { accessToken, isAuthenticated } = useOrderCloud();
  return <div>{isAuthenticated ? `ready:${accessToken}` : 'not-ready'}</div>;
};

const ProductsConsumer = () => {
  const { accessToken, products } = useOrderCloud();
  const [result, setResult] = useState('pending');

  useEffect(() => {
    void products
      .list()
      .then((response) => setResult(response.items[0]?.id ?? 'empty'))
      .catch(() => undefined);
  }, [products]);

  return <div>{`${result}:${accessToken}`}</div>;
};

const jsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  }) as Response;

describe('OrderCloudProvider', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ORDERCLOUD_PROXY_URL = 'https://proxy.example/oc';
    clearStoredOrderCloudToken();
    fetchMock = jest.fn();
    Object.defineProperty(global, 'fetch', { configurable: true, value: fetchMock });
  });

  afterEach(() => Reflect.deleteProperty(global, 'fetch'));

  afterAll(() => {
    if (originalProxyUrl === undefined) delete process.env.NEXT_PUBLIC_ORDERCLOUD_PROXY_URL;
    else process.env.NEXT_PUBLIC_ORDERCLOUD_PROXY_URL = originalProxyUrl;
  });

  test('reuses a valid cookie without requesting another token', async () => {
    writeStoredOrderCloudToken('stored-token', 3600);
    render(
      <OrderCloudProvider>
        <Consumer />
      </OrderCloudProvider>
    );

    expect(await screen.findByText('ready:stored-token')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('blocks children and acquires one token when none is stored', async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    fetchMock.mockReturnValue(fetchPromise);

    render(
      <OrderCloudProvider>
        <Consumer />
      </OrderCloudProvider>
    );

    expect(screen.getByText('Starting commerce session...')).toBeInTheDocument();
    expect(screen.queryByText(/ready:/)).not.toBeInTheDocument();
    resolveFetch(jsonResponse({ access_token: 'new-token', expires_in: 3600 }));

    expect(await screen.findByText('ready:new-token')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://proxy.example/oc/oauth/token',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('deduplicates authentication when React Strict Mode reruns effects', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ access_token: 'new-token', expires_in: 3600 }));

    render(
      <StrictMode>
        <OrderCloudProvider>
          <Consumer />
        </OrderCloudProvider>
      </StrictMode>
    );

    expect(await screen.findByText('ready:new-token')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('reauthenticates and retries a proxy request once after a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: 'first-token', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ error: 'expired' }, 401))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'second-token', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ Items: [{ ID: 'product-1', Name: 'Product' }] }));

    render(
      <OrderCloudProvider>
        <ProductsConsumer />
      </OrderCloudProvider>
    );

    expect(await screen.findByText('product-1:second-token')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const retryHeaders = new Headers(fetchMock.mock.calls[3][1]?.headers);
    expect(retryHeaders.get('Authorization')).toBe('Bearer second-token');
  });

  test('treats a second 401 as terminal without retrying again', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: 'first-token', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ error: 'expired' }, 401))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'second-token', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ error: 'still unauthorized' }, 401));

    render(
      <OrderCloudProvider>
        <ProductsConsumer />
      </OrderCloudProvider>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('still unauthorized');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  test('retries a transient authentication failure and renders children after recovery', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'Temporarily unavailable' }, 503))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'recovered-token', expires_in: 3600 }));

    render(
      <OrderCloudProvider>
        <Consumer />
      </OrderCloudProvider>
    );

    expect(await screen.findByText('ready:recovered-token')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('does not retry a terminal 4xx authentication error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Invalid client' }, 400));

    render(
      <OrderCloudProvider>
        <Consumer />
      </OrderCloudProvider>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to start commerce session: Invalid client'
    );
    expect(screen.queryByText(/ready:/)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('stops retrying after three transient authentication failures', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Client unavailable' }, 503));

    render(
      <OrderCloudProvider>
        <Consumer />
      </OrderCloudProvider>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to start commerce session: Client unavailable'
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test('lists missing required environment configuration', async () => {
    delete process.env.NEXT_PUBLIC_ORDERCLOUD_PROXY_URL;

    render(
      <OrderCloudProvider>
        <Consumer />
      </OrderCloudProvider>
    );

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('NEXT_PUBLIC_ORDERCLOUD_PROXY_URL')
    );
  });
});
