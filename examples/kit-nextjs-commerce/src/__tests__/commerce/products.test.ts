import { ProductsService } from '@/lib/commerce/products';
import type { CommerceRequest } from '@/lib/commerce/client';

describe('product service', () => {
  const originalCatalogId = process.env.NEXT_PUBLIC_ORDERCLOUD_CATALOG_ID;
  const originalProxyUrl = process.env.NEXT_PUBLIC_ORDERCLOUD_PROXY_URL;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_ORDERCLOUD_PROXY_URL = 'https://proxy.example/oc';
  });

  afterAll(() => {
    if (originalCatalogId === undefined) delete process.env.NEXT_PUBLIC_ORDERCLOUD_CATALOG_ID;
    else process.env.NEXT_PUBLIC_ORDERCLOUD_CATALOG_ID = originalCatalogId;

    if (originalProxyUrl === undefined) delete process.env.NEXT_PUBLIC_ORDERCLOUD_PROXY_URL;
    else process.env.NEXT_PUBLIC_ORDERCLOUD_PROXY_URL = originalProxyUrl;
  });

  test('requests buyer products and maps valid OrderCloud items', async () => {
    process.env.NEXT_PUBLIC_ORDERCLOUD_CATALOG_ID = 'catalog/1';
    const request = jest.fn().mockResolvedValue({
      Items: [
        {
          ID: 'product-1',
          Name: 'Headphones',
          Description: 'Description',
          xp: { imageUrl: '/image.jpg', brand: 'Brand', category: 'Audio' },
          PriceSchedule: { PriceBreaks: [{ Price: 19.99, Currency: 'USD' }] },
        },
        { ID: 'missing-name' },
      ],
    }) as jest.MockedFunction<CommerceRequest>;
    const controller = new AbortController();
    const products = new ProductsService(request);

    await expect(products.list({ signal: controller.signal })).resolves.toEqual({
      items: [
        {
          id: 'product-1',
          name: 'Headphones',
          description: 'Description',
          imageUrl: '/image.jpg',
          brand: 'Brand',
          category: 'Audio',
          price: 19.99,
          currency: 'USD',
        },
      ],
    });
    expect(request).toHaveBeenCalledWith('/v1/me/products?catalogID=catalog%2F1', {
      signal: controller.signal,
    });
  });
});
