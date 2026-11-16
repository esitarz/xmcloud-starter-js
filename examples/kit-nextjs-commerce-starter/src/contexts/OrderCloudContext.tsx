'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import {
  useCommerce,
  type CommerceError,
  type ShopperSession,
} from '@sitecore-content-sdk/nextjs/commerce';
import {
  createOrderCloudServices,
  createUnavailableServices,
  type OrderCloudServices,
} from '@/lib/commerce/services';

export type OrderCloudAuthStatus = 'loading' | 'authenticated' | 'error';

export interface OrderCloudContextValue extends OrderCloudServices {
  status: OrderCloudAuthStatus;
  isAuthenticated: boolean;
  error: CommerceError | null;
  /** Returns a usable SDK shopper session (e.g. to send its access token to checkout routes). */
  ensureSession: () => Promise<ShopperSession>;
  /** Drops the current shopper session and starts a new anonymous one. */
  resetSession: () => Promise<void>;
}

const OrderCloudContext = createContext<OrderCloudContextValue | undefined>(undefined);

// Cookie written by the starter's previous, self-managed anonymous session.
const LEGACY_TOKEN_COOKIES = ['oc_anonymous_token', process.env.NEXT_PUBLIC_ORDERCLOUD_AUTH_COOKIE_NAME]
  .map((name) => name?.trim())
  .filter((name): name is string => !!name && /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name));

const clearLegacyTokenCookies = (): void => {
  for (const name of LEGACY_TOKEN_COOKIES) {
    if (document.cookie.split(';').some((cookie) => cookie.trim().startsWith(`${name}=`))) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  }
};

/**
 * Starter cart and session helpers on top of the SDK `CommerceProvider` session, so products, cart
 * and checkout all run as the same shopper. Products load through the SDK hooks
 * (`ProductProvider`, `useProducts`). Must be rendered inside `CommerceProvider`.
 */
export function OrderCloudProvider({ children }: { children: React.ReactNode }) {
  const { service, status: sdkStatus, error, ensureSession, resetSession } = useCommerce();

  useEffect(clearLegacyTokenCookies, []);

  // Cart components (and infinite-scroll product lists) wait for a session, so start one on mount.
  useEffect(() => {
    if (sdkStatus === 'idle') ensureSession().catch(() => undefined);
  }, [sdkStatus, ensureSession]);

  const services = useMemo(
    () =>
      service
        ? createOrderCloudServices(service)
        : createUnavailableServices(error ?? new Error('Commerce is not configured.')),
    [service, error]
  );

  const status: OrderCloudAuthStatus =
    sdkStatus === 'ready' ? 'authenticated' : sdkStatus === 'error' ? 'error' : 'loading';

  const value = useMemo<OrderCloudContextValue>(
    () => ({
      ...services,
      status,
      isAuthenticated: status === 'authenticated',
      error,
      ensureSession,
      resetSession: async () => {
        await resetSession();
      },
    }),
    [services, status, error, ensureSession, resetSession]
  );

  return <OrderCloudContext.Provider value={value}>{children}</OrderCloudContext.Provider>;
}

export const useOrderCloud = (): OrderCloudContextValue => {
  const context = useContext(OrderCloudContext);
  if (!context) throw new Error('useOrderCloud must be used within an OrderCloudProvider');
  return context;
};
