"use client";

import {
  useProduct,
  type UseProductState,
} from "@sitecore-content-sdk/nextjs/commerce";
import type {
  CommerceProduct,
  CommerceProductXp,
} from "@/lib/commerce/products/types";

type StarterProductState = UseProductState<CommerceProduct, CommerceProductXp>;

/**
 * Product state from the nearest ProductContainer, typed with the starter's `select`
 * (`toCommerceProduct`). Returns null outside a ProductContainer so renderings can show their
 * authoring fallback.
 */
export const useStarterProduct = (): StarterProductState | null =>
  useProduct<CommerceProduct, CommerceProductXp>({ optional: true });

/** Authoring message for a product that is not loaded, or undefined while loading/loaded. */
export const getProductStatusMessage = (
  product: StarterProductState,
  fallback: string,
): string | undefined => {
  if (product.status === "idle" && !product.productId)
    return "Configure Product Source and its corresponding product ID on ProductContainer.";
  if (product.status === "not-found")
    return `Product ${product.productId ?? ""} was not found.`;
  if (product.status === "error") return product.error?.message ?? fallback;
  return undefined;
};
