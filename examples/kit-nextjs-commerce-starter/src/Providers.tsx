"use client";
import React from "react";
import {
  ComponentPropsCollection,
  ComponentPropsContext,
  Page,
  SitecoreProvider,
} from "@sitecore-content-sdk/nextjs";
import scConfig from "sitecore.config";
import components from ".sitecore/component-map.client";
import { CommerceProvider } from "@sitecore-content-sdk/nextjs/commerce";
import { OrderCloudProvider } from "./contexts/OrderCloudContext";
import { RoutePathProvider } from "./contexts/RoutePathContext";

export default function Providers({
  children,
  page,
  componentProps = {},
  routePath = [],
}: {
  children: React.ReactNode;
  page: Page;
  componentProps?: ComponentPropsCollection;
  routePath?: string[];
}) {
  return (
    <SitecoreProvider
      api={scConfig.api}
      componentMap={components}
      page={page}
      loadImportMap={() => import(".sitecore/import-map.client")}
    >
      <RoutePathProvider routePath={routePath}>
        {/* Route-handler tokens via app/api/commerce/token; in-memory in editing/preview */}
        <CommerceProvider>
          <OrderCloudProvider>
            <ComponentPropsContext value={componentProps}>
              {children}
            </ComponentPropsContext>
          </OrderCloudProvider>
        </CommerceProvider>
      </RoutePathProvider>
    </SitecoreProvider>
  );
}
