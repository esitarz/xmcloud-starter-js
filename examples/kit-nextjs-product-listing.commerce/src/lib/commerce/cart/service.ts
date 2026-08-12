import 'server-only';
import { dispatchToLocalProxy, type DispatchPayload } from '@/lib/commerce/dispatcher/service';
import type { CommerceCart } from './types';

const PROXY_ORIGIN = 'https://local.test/storefront';

type OrderCloudCart = {
  ID?: unknown;
  Status?: unknown;
  Currency?: unknown;
  Subtotal?: unknown;
  TaxCost?: unknown;
  Total?: unknown;
  IsCalculated?: unknown;
};

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const createPayload = (shopperToken: string): DispatchPayload => ({
  currentRequest: {
    url: `${PROXY_ORIGIN}/v1/me/cart`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${shopperToken}`,
    },
  },
  traceType: 'none',
  currentStep: 'nextjs-cart-read',
});

const parseCart = (body: string): CommerceCart => {
  let order: OrderCloudCart;

  try {
    order = JSON.parse(body) as OrderCloudCart;
  } catch {
    throw new Error('OrderCloud cart response was not valid JSON');
  }

  const id = asString(order.ID);

  if (!id) {
    throw new Error('OrderCloud cart response did not include an order ID');
  }

  if (order.Status !== 'Unsubmitted') {
    throw new Error('OrderCloud cart response was not an unsubmitted order');
  }

  return {
    id,
    status: 'Unsubmitted',
    currency: asString(order.Currency),
    subtotal: asNumber(order.Subtotal),
    taxCost: asNumber(order.TaxCost),
    total: asNumber(order.Total),
    isCalculated: order.IsCalculated === true,
  };
};

export const getCart = async (shopperToken: string): Promise<CommerceCart> => {
  const response = await dispatchToLocalProxy(createPayload(shopperToken));

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`OrderCloud cart request failed with status ${response.status}`);
  }

  return parseCart(response.body);
};
