import { getOrderCloudAuthCookieName } from '../browser-config';

const EXPIRATION_SKEW_MS = 60_000;
const STORAGE_PREFIX = 'oc_token_store:';

export interface StoredOrderCloudToken {
  accessToken: string;
  expiresAt: number;
}

const getCookieValue = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;

  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.substring(name.length + 1);
};

const getStorageKey = (): string => `${STORAGE_PREFIX}${getOrderCloudAuthCookieName()}`;

const readLocalValue = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;

  try {
    return window.localStorage.getItem(getStorageKey()) ?? undefined;
  } catch {
    return undefined;
  }
};

const writeLocalValue = (value: string): void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(getStorageKey(), value);
  } catch {
    // Ignore storage failures; cookie storage may still be available.
  }
};

const clearLocalValue = (): void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(getStorageKey());
  } catch {
    // Ignore storage failures.
  }
};

const getCookieAttributes = (maxAge: number): string => {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';

  if (isSecure) {
    return `Path=/; Max-Age=${maxAge}; SameSite=None; Secure`;
  }

  return `Path=/; Max-Age=${maxAge}; SameSite=Lax`;
};

export const clearStoredOrderCloudToken = (): void => {
  if (typeof document === 'undefined') return;

  const cookieName = getOrderCloudAuthCookieName();
  clearLocalValue();
  document.cookie = `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${cookieName}=; Path=/; Max-Age=0; SameSite=None; Secure`;
};

export const readStoredOrderCloudToken = (now = Date.now()): StoredOrderCloudToken | null => {
  const value = getCookieValue(getOrderCloudAuthCookieName()) ?? readLocalValue();
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<StoredOrderCloudToken>;
    if (
      typeof parsed.accessToken !== 'string' ||
      !parsed.accessToken.trim() ||
      typeof parsed.expiresAt !== 'number' ||
      !Number.isFinite(parsed.expiresAt) ||
      parsed.expiresAt <= now + EXPIRATION_SKEW_MS
    ) {
      clearStoredOrderCloudToken();
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    clearStoredOrderCloudToken();
    return null;
  }
};

export const writeStoredOrderCloudToken = (
  accessToken: string,
  expiresInSeconds: number,
  now = Date.now()
): StoredOrderCloudToken => {
  if (typeof document === 'undefined') {
    throw new Error('OrderCloud tokens can only be stored in a browser');
  }

  if (!accessToken.trim() || !Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error('OrderCloud token response was invalid');
  }

  const maxAge = Math.max(1, Math.floor(expiresInSeconds));
  const storedToken = {
    accessToken,
    expiresAt: now + maxAge * 1000,
  };
  const encodedToken = encodeURIComponent(JSON.stringify(storedToken));

  writeLocalValue(encodedToken);
  document.cookie = `${getOrderCloudAuthCookieName()}=${encodedToken}; ${getCookieAttributes(maxAge)}`;
  return storedToken;
};
