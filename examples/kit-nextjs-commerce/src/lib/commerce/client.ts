import { getCommerceBrowserConfig } from './browser-config';

export type CommerceRequest = <T>(path: string, init?: RequestInit) => Promise<T>;

export class CommerceProxyError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'CommerceProxyError';
  }
}

const getErrorMessage = (body: unknown, status: number): string => {
  if (body && typeof body === 'object') {
    const payload = body as {
      Message?: unknown;
      Errors?: Array<{ Message?: unknown }>;
      error?: unknown;
      error_description?: unknown;
    };
    const candidates = [
      payload.Message,
      payload.Errors?.[0]?.Message,
      payload.error_description,
      payload.error,
    ];
    const message = candidates.find(
      (candidate): candidate is string => typeof candidate === 'string' && !!candidate.trim()
    );
    if (message) return message;
  }

  return `OrderCloud proxy request failed with status ${status}`;
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const buildProxyUrl = (path: string): string => {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error('OrderCloud proxy paths must start with a single forward slash');
  }

  return `${getCommerceBrowserConfig().proxyBaseUrl}${path}`;
};

export const requestAnonymousOrderCloudToken = async (): Promise<{
  accessToken: string;
  expiresIn: number;
}> => {
  const config = getCommerceBrowserConfig();
  const params = new URLSearchParams({ grant_type: 'client_credentials' });
  if (config.anonymousScope) params.set('scope', config.anonymousScope);

  const response = await fetch(`${config.proxyBaseUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new CommerceProxyError(getErrorMessage(body, response.status), response.status);
  }

  const token = body as { access_token?: unknown; expires_in?: unknown } | undefined;
  if (
    typeof token?.access_token !== 'string' ||
    !token.access_token.trim() ||
    typeof token.expires_in !== 'number' ||
    !Number.isFinite(token.expires_in) ||
    token.expires_in <= 0
  ) {
    throw new Error(
      'OrderCloud token response did not include a valid access token and expiration'
    );
  }

  return { accessToken: token.access_token, expiresIn: token.expires_in };
};

export const requestOrderCloudProxy = async <T>(
  path: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(buildProxyUrl(path), { ...init, headers });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new CommerceProxyError(getErrorMessage(body, response.status), response.status);
  }

  return body as T;
};
