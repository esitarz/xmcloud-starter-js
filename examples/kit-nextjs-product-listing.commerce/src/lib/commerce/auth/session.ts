import 'server-only';
import { cookies } from 'next/headers';
import { commerceAuthConfig } from './config';

export interface AuthTokenStore {
  read(): Promise<string | null>;
  write(token: string, expiresInSeconds: number): Promise<void>;
  clear(): Promise<void>;
}

class CookieTokenStore implements AuthTokenStore {
  async read(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(commerceAuthConfig.tokenCookieName)?.value || null;
  }

  async write(token: string, expiresInSeconds: number): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(commerceAuthConfig.tokenCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.max(60, Math.floor(expiresInSeconds)),
    });
  }

  async clear(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(commerceAuthConfig.tokenCookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
}

export const createAuthTokenStore = (): AuthTokenStore => {
  if (commerceAuthConfig.tokenStorage !== 'cookie') {
    console.warn(
      `Unsupported ORDCLOUD_TOKEN_STORAGE=${commerceAuthConfig.tokenStorage}. Falling back to cookie store.`
    );
  }

  return new CookieTokenStore();
};
