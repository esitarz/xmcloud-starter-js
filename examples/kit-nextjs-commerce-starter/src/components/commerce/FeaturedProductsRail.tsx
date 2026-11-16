"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useProducts } from "@sitecore-content-sdk/nextjs/commerce";
import { buildProductDetailHref } from "@/lib/commerce/products/href";
import { toCommerceProduct } from "@/lib/commerce/products/mapper";
import {
  orderProductsByIds,
  toUniqueProductIds,
} from "@/lib/commerce/products/service";
import OrderCloudProductCard from "./OrderCloudProductCard";

type FeaturedProductsRailProps = {
  detailPageHref: string;
  header?: ReactNode;
  isAuthoring: boolean;
  maxProductsPerRow: number;
  productIds: string[];
};

type ScrollState = {
  hasOverflow: boolean;
  canScrollBackward: boolean;
  canScrollForward: boolean;
};

const EMPTY_SCROLL_STATE: ScrollState = {
  hasOverflow: false,
  canScrollBackward: false,
  canScrollForward: false,
};

const ProductSkeleton = () => (
  <div className="w-full space-y-2" aria-hidden="true">
    <div className="aspect-square animate-pulse rounded bg-slate-100" />
    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
    <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
  </div>
);

export default function FeaturedProductsRail({
  detailPageHref,
  header,
  isAuthoring,
  maxProductsPerRow,
  productIds,
}: FeaturedProductsRailProps) {
  const uniqueIds = useMemo(() => toUniqueProductIds(productIds), [productIds]);
  const list = useProducts(
    { pageSize: uniqueIds.length, filters: { ID: uniqueIds } },
    { select: toCommerceProduct, enabled: uniqueIds.length > 0 },
  );
  const products = useMemo(
    () => orderProductsByIds(list.items, uniqueIds),
    [list.items, uniqueIds],
  );
  // While other IDs load, keep showing already-loaded products that are still selected.
  const loading =
    list.isLoading || (list.isRefetching && products.length === 0);
  const error = list.isError;
  const [scrollState, setScrollState] =
    useState<ScrollState>(EMPTY_SCROLL_STATE);
  const railRef = useRef<HTMLDivElement>(null);

  const updateScrollState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) {
      setScrollState(EMPTY_SCROLL_STATE);
      return;
    }

    const maximumScrollLeft = rail.scrollWidth - rail.clientWidth;
    const hasOverflow = maximumScrollLeft > 1;
    setScrollState({
      hasOverflow,
      canScrollBackward: hasOverflow && rail.scrollLeft > 1,
      canScrollForward:
        hasOverflow && rail.scrollLeft < maximumScrollLeft - 1,
    });
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    updateScrollState();
    rail.addEventListener("scroll", updateScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(rail);

    return () => {
      rail.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [products, loading, updateScrollState]);

  const scroll = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    rail.scrollBy({
      left: direction * rail.clientWidth * 0.85,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  if (productIds.length === 0) {
    return isAuthoring ? (
      <>
        {header}
        <p className="rounded border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          Choose products in the component properties.
        </p>
      </>
    ) : null;
  }

  if (!loading && error) {
    return (
      <>
        {header}
        <p
          role="alert"
          className="rounded border border-slate-200 bg-slate-50 p-4 text-sm"
        >
          Products are temporarily unavailable.
        </p>
      </>
    );
  }

  if (!loading && products.length === 0) {
    return isAuthoring ? (
      <>
        {header}
        <p className="rounded border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          The selected products are not visible to the current shopper.
        </p>
      </>
    ) : null;
  }

  const visibleItemCount = Math.min(
    maxProductsPerRow,
    loading ? productIds.length : products.length,
  );
  const cardBasis = `calc((100% - ${(maxProductsPerRow - 1) * 16}px) / ${maxProductsPerRow})`;
  const railStyle = {
    "--featured-product-basis": cardBasis,
  } as CSSProperties;

  return (
    <>
      {header}
      <div className="space-y-3">
        {scrollState.hasOverflow && (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => scroll(-1)}
              disabled={!scrollState.canScrollBackward}
              aria-label="Previous featured products"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-lg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              disabled={!scrollState.canScrollForward}
              aria-label="Next featured products"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-lg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        <div
          ref={railRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={railStyle}
          aria-busy={loading}
        >
          {loading
            ? Array.from({ length: visibleItemCount }, (_, index) => (
                <div
                  key={`featured-product-skeleton-${index}`}
                  className={`${
                    productIds.length === 1
                      ? "w-full"
                      : "w-[82%] sm:w-[calc((100%_-_1rem)/2)] lg:w-[var(--featured-product-basis)]"
                  } shrink-0 snap-start`}
                >
                  <ProductSkeleton />
                </div>
              ))
            : products.map((product) => (
                <div
                  key={product.id}
                  className={`${
                    products.length === 1
                      ? "w-full"
                      : "w-[82%] sm:w-[calc((100%_-_1rem)/2)] lg:w-[var(--featured-product-basis)]"
                  } shrink-0 snap-start`}
                >
                  <OrderCloudProductCard
                    product={product}
                    href={buildProductDetailHref(detailPageHref, product.id)}
                  />
                </div>
              ))}
          {loading && (
            <span className="sr-only">Loading featured products…</span>
          )}
        </div>
      </div>
    </>
  );
}
