'use client';

import React, { useMemo } from 'react';
import { SitecoreProvider, type Page } from '@sitecore-content-sdk/nextjs';
import { CommerceProvider } from '@sitecore-content-sdk/nextjs/commerce';
import scConfig from 'sitecore.config';
import { OrderCloudProvider } from './OrderCloudContext';

const EMPTY_COMPONENT_MAP = new Map();

const createPage = (authoring: boolean): Page => ({
  layout: { sitecore: { context: {}, route: null } },
  locale: scConfig.defaultLanguage,
  mode: {
    name: authoring ? 'edit' : 'normal',
    designLibrary: { isVariantGeneration: false },
    isNormal: !authoring,
    isPreview: false,
    isEditing: authoring,
    isDesignLibrary: false,
  },
} as Page);

/**
 * Commerce providers for app routes rendered outside a Sitecore page (no layout data).
 * The SDK `CommerceProvider` reads the Edge context from `SitecoreProvider`, so a minimal one is
 * mounted here.
 * - `authoring`: tools hosted in the SitecoreAI iframe (e.g. the product picker). Uses the SDK's
 *   in-memory editing session and never touches the visitor's cookies.
 * - otherwise: the visitor's shopper session (same cookies as the storefront pages).
 */
export function StandaloneCommerceProviders({
  authoring = false,
  children,
}: {
  authoring?: boolean;
  children: React.ReactNode;
}) {
  const page = useMemo(() => createPage(authoring), [authoring]);

  return (
    <SitecoreProvider api={scConfig.api} componentMap={EMPTY_COMPONENT_MAP} page={page}>
      <CommerceProvider>
        <OrderCloudProvider>{children}</OrderCloudProvider>
      </CommerceProvider>
    </SitecoreProvider>
  );
}
