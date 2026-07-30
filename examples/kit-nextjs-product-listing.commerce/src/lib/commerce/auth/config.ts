import 'server-only';

const DEFAULT_OC_API_URL = 'https://sandboxapi.ordercloud.io';

const readBaseApiUrl = (): string => {
  const raw = process.env.ORDERCLOUD_BASE_API_URL || process.env.NEXT_PUBLIC_ORDERCLOUD_BASE_API_URL;
  return (raw || DEFAULT_OC_API_URL).replace(/\/$/, '');
};

export const commerceAuthConfig = {
  baseApiUrl: readBaseApiUrl(),
  tokenCookieName: process.env.ORDERCLOUD_AUTH_COOKIE_NAME || 'oc_auth_token',
  tokenStorage: process.env.ORDERCLOUD_TOKEN_STORAGE || 'cookie',
  defaultBuyerId: process.env.ORDERCLOUD_DEFAULT_BUYER_ID,
  defaultBuyerClientId: process.env.ORDERCLOUD_BUYER_CLIENT_ID,
  buyerClientIdMap: process.env.ORDERCLOUD_BUYER_CLIENT_IDS,
  anonymousScope: process.env.ORDERCLOUD_ANONYMOUS_SCOPE,
};

export const getBuyerClientIdMap = (): Record<string, string> => {
  const raw = commerceAuthConfig.buyerClientIdMap;
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed;
  } catch (error) {
    console.error('Invalid ORDERCLOUD_BUYER_CLIENT_IDS JSON:', error);
    return {};
  }
};

export const resolveBuyerClientId = (buyerId?: string): string => {
  const normalizedBuyerId = (buyerId || commerceAuthConfig.defaultBuyerId || '').trim();
  const map = getBuyerClientIdMap();

  if (normalizedBuyerId && map[normalizedBuyerId]) {
    return map[normalizedBuyerId];
  }

  if (commerceAuthConfig.defaultBuyerClientId) {
    return commerceAuthConfig.defaultBuyerClientId;
  }

  throw new Error('Missing buyer client id configuration for OrderCloud auth');
};
