import { NextResponse } from 'next/server';
import { dispatchToLocalProxy, type DispatchPayload } from '@/lib/commerce/dispatcher/service';
import { commerceDispatcherConfig } from '@/lib/commerce/dispatcher/config';
import { commerceAuthConfig } from '@/lib/commerce/auth/config';
import type { CommerceProduct, CommerceProductList } from '@/lib/commerce/products';

export const dynamic = 'force-dynamic';

type OrderCloudProduct = {
  ID?: unknown;
  Name?: unknown;
  Description?: unknown;
  ImageUrl?: unknown;
  PriceSchedule?: unknown;
  DefaultPriceSchedule?: unknown;
  xp?: unknown;
};

type OrderCloudProductList = {
  Items?: unknown;
};

const PROXY_ORIGIN = 'https://local.test/storefront';

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const getPrice = (value: unknown): { price?: number; currency?: string } => {
  const priceSchedule = asRecord(value);
  const priceBreaks = Array.isArray(priceSchedule?.PriceBreaks) ? priceSchedule.PriceBreaks : [];
  const firstPriceBreak = asRecord(priceBreaks[0]);

  return {
    price: asNumber(firstPriceBreak?.Price),
    currency: asString(firstPriceBreak?.Currency),
  };
};

const toCommerceProduct = (value: unknown): CommerceProduct | undefined => {
  const product = value as OrderCloudProduct;
  const id = asString(product?.ID);
  const name = asString(product?.Name);

  if (!id || !name) {
    return undefined;
  }

  const xp = asRecord(product.xp);
  const price = getPrice(product.PriceSchedule ?? product.DefaultPriceSchedule);
  const xpPrice = asNumber(xp?.price);

  return {
    id,
    name,
    description: asString(product.Description),
    imageUrl: asString(product.ImageUrl) ?? asString(xp?.imageUrl) ?? asString(xp?.ImageUrl),
    brand: asString(xp?.brand),
    category: asString(xp?.category),
    price: price.price ?? xpPrice,
    currency: price.currency,
  };
};

const createPayload = (
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): DispatchPayload => ({
  currentRequest: {
    url,
    method,
    headers,
    body,
    contentType: headers['Content-Type'],
  },
  originalRequestData: {
    url,
    method,
    headers,
    body,
    contentType: headers['Content-Type'],
  },
  traceType: 'none',
  currentStep: 'nextjs-product-list',
});

const getProxyErrorMessage = (body: string, status: number): string => {
  try {
    const payload = JSON.parse(body) as {
      Message?: unknown;
      Errors?: Array<{ Message?: unknown }>;
      error?: unknown;
      error_description?: unknown;
    };
    const message =
      asString(payload.Message) ??
      asString(payload.Errors?.[0]?.Message) ??
      asString(payload.error_description) ??
      asString(payload.error);

    if (message) {
      return `OrderCloud request failed with status ${status}: ${message}`;
    }
  } catch {
    // The proxy may return an empty or non-JSON error body.
  }

  return `OrderCloud request failed with status ${status}`;
};

const getAccessToken = async (): Promise<string> => {
  const params = new URLSearchParams();
  params.set('grant_type', 'client_credentials');

  if (commerceAuthConfig.anonymousScope) {
    params.set('scope', commerceAuthConfig.anonymousScope);
  }

  const response = await dispatchToLocalProxy(
    createPayload(
      `${PROXY_ORIGIN}/oauth/token`,
      'POST',
      { 'Content-Type': 'application/x-www-form-urlencoded' },
      params.toString()
    )
  );

  if (response.status < 200 || response.status >= 300) {
    throw new Error(getProxyErrorMessage(response.body, response.status));
  }

  const body = JSON.parse(response.body) as { access_token?: unknown };
  const accessToken = asString(body.access_token);

  if (!accessToken) {
    throw new Error('OrderCloud token response did not include an access token');
  }

  return accessToken;
};

export async function GET(): Promise<NextResponse<CommerceProductList | { error: string }>> {
  try {
    const accessToken = await getAccessToken();
    const catalogId = commerceDispatcherConfig.catalogId;
    const meEndpoint = `${PROXY_ORIGIN}/v1/me/products`;
    const catalogScopedEndpoint = catalogId
      ? `${meEndpoint}?catalogID=${encodeURIComponent(catalogId)}`
      : meEndpoint;

    const requestHeaders = {
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await dispatchToLocalProxy(
      createPayload(catalogScopedEndpoint, 'GET', requestHeaders)
    );

    if (response.status < 200 || response.status >= 300) {
      throw new Error(getProxyErrorMessage(response.body, response.status));
    }

    const body = JSON.parse(response.body) as OrderCloudProductList;
    const items = Array.isArray(body.Items)
      ? body.Items.map(toCommerceProduct).filter((product): product is CommerceProduct => !!product)
      : [];

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load OrderCloud products';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}