"use client";

import type { ReactNode } from "react";
import { ProductProvider } from "@sitecore-content-sdk/nextjs/commerce";
import { useRoutePath } from "@/contexts/RoutePathContext";
import { toCommerceProduct } from "@/lib/commerce/products/mapper";
import {
  resolveProductId,
  type ProductReference,
  type ProductSource,
} from "@/lib/commerce/products/reference";
import { validateSpecValue } from "@/lib/commerce/products/specs";
import type {
  CommerceProduct,
  CommerceProductXp,
} from "@/lib/commerce/products/types";

/**
 * Resolves the product ID from the ProductContainer datasource (picker or last URL segment, with
 * the preview product while authoring) and provides it to children through the SDK
 * `ProductProvider`. Read it with `useStarterProduct`, `useProductOptions` and `useProductSelection`.
 */
export const ProductContainerProvider = ({
  source,
  selectedProduct,
  previewProduct,
  isAuthoring,
  children,
}: {
  source?: ProductSource;
  selectedProduct?: ProductReference;
  previewProduct?: ProductReference;
  isAuthoring: boolean;
  children: ReactNode;
}) => {
  const routePath = useRoutePath();
  const productId = resolveProductId({
    source,
    routePath: [...routePath],
    selectedProduct,
    previewProduct,
    isAuthoring,
  });

  return (
    <ProductProvider<CommerceProduct, CommerceProductXp>
      productId={productId}
      select={toCommerceProduct}
      validateSpec={validateSpecValue}
    >
      {children}
    </ProductProvider>
  );
};
