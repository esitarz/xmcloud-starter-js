jest.mock('server-only', () => ({}));

import { readBearerToken } from '@/lib/commerce/auth/bearer-token';

const requestWithAuthorization = (authorization?: string): Request =>
  ({
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'authorization' ? (authorization ?? null) : null,
    },
  }) as Request;

describe('readBearerToken', () => {
  test('returns a trimmed bearer token', () => {
    expect(readBearerToken(requestWithAuthorization('Bearer shopper-token '))).toBe(
      'shopper-token'
    );
  });

  test.each([undefined, 'Basic credentials', 'Bearer   '])(
    'rejects a missing or invalid authorization header',
    (authorization) => {
      expect(readBearerToken(requestWithAuthorization(authorization))).toBeNull();
    }
  );
});
