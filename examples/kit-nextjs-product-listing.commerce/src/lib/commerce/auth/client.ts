import 'server-only';
import { commerceAuthConfig } from './config';
import { OrderCloudApiError } from './types';

const buildUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${commerceAuthConfig.baseApiUrl}${normalizedPath}`;
};

const buildError = async (response: Response): Promise<Error> => {
  let payload: OrderCloudApiError | null = null;

  try {
    payload = (await response.json()) as OrderCloudApiError;
  } catch {
    payload = null;
  }

  const message =
    payload?.Message ||
    payload?.Errors?.[0]?.Message ||
    `OrderCloud request failed: ${response.status}`;

  return new Error(message);
};

export const orderCloudRequest = async <T>(
  path: string,
  init: RequestInit,
  token?: string
): Promise<T> => {
  const headers = new Headers(init.headers || {});

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw await buildError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const orderCloudTokenRequest = async <T>(params: URLSearchParams): Promise<T> => {
  const response = await fetch(buildUrl('/oauth/token'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw await buildError(response);
  }

  return (await response.json()) as T;
};
