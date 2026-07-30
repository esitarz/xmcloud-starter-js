import 'server-only';

const DEFAULT_LOCAL_PROXY_URL = 'http://127.0.0.1:8795';

const normalizeBaseUrl = (value: string): string => value.replace(/\/$/, '');

const readProxyBaseUrl = (): string => {
  const raw = process.env.LOCAL_COMMERCE_PROXY_URL || DEFAULT_LOCAL_PROXY_URL;
  return normalizeBaseUrl(raw);
};

const readTenantId = (): string => {
  return (
    process.env.LOCAL_ORDERCLOUD_TENANT_ID ||
    process.env.ORDERCLOUD_TENANT_ID ||
    '63f53581-026c-4660-28db-08db9261b75f'
  );
};

export const commerceDispatcherConfig = {
  proxyBaseUrl: readProxyBaseUrl(),
  tenantId: readTenantId(),
};
