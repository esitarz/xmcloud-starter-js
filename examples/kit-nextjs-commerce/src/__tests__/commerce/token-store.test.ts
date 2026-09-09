import {
  clearStoredOrderCloudToken,
  readStoredOrderCloudToken,
  writeStoredOrderCloudToken,
} from '@/lib/commerce/auth/token-store';
import {
  DEFAULT_ORDERCLOUD_AUTH_COOKIE_NAME,
  getOrderCloudAuthCookieName,
} from '@/lib/commerce/browser-config';

describe('browser OrderCloud token store', () => {
  const originalCookieName = process.env.NEXT_PUBLIC_ORDERCLOUD_AUTH_COOKIE_NAME;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ORDERCLOUD_AUTH_COOKIE_NAME;
    clearStoredOrderCloudToken();
  });

  afterAll(() => {
    if (originalCookieName === undefined) {
      delete process.env.NEXT_PUBLIC_ORDERCLOUD_AUTH_COOKIE_NAME;
    } else {
      process.env.NEXT_PUBLIC_ORDERCLOUD_AUTH_COOKIE_NAME = originalCookieName;
    }
  });

  test('stores and reads a token with its expiration', () => {
    const token = writeStoredOrderCloudToken('access-token', 3600, 1_000);

    expect(token).toEqual({ accessToken: 'access-token', expiresAt: 3_601_000 });
    expect(readStoredOrderCloudToken(2_000)).toEqual(token);
    expect(document.cookie).toContain(`${DEFAULT_ORDERCLOUD_AUTH_COOKIE_NAME}=`);
  });

  test('clears a token that is within the expiration skew', () => {
    writeStoredOrderCloudToken('access-token', 60, 1_000);
    expect(readStoredOrderCloudToken(1_000)).toBeNull();
    expect(document.cookie).not.toContain(`${DEFAULT_ORDERCLOUD_AUTH_COOKIE_NAME}=`);
  });

  test('clears malformed cookie content', () => {
    document.cookie = `${DEFAULT_ORDERCLOUD_AUTH_COOKIE_NAME}=not-json; Path=/`;
    expect(readStoredOrderCloudToken()).toBeNull();
    expect(document.cookie).not.toContain(`${DEFAULT_ORDERCLOUD_AUTH_COOKIE_NAME}=`);
  });

  test('uses the configured authentication cookie name', () => {
    process.env.NEXT_PUBLIC_ORDERCLOUD_AUTH_COOKIE_NAME = 'custom_oc_token';

    writeStoredOrderCloudToken('access-token', 3600);

    expect(getOrderCloudAuthCookieName()).toBe('custom_oc_token');
    expect(document.cookie).toContain('custom_oc_token=');
    clearStoredOrderCloudToken();
  });
});
