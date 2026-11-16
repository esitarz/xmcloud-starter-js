"use client";

import { useMemo } from "react";
import type React from "react";
import {
  useProductOptions,
  useProductSelection,
} from "@sitecore-content-sdk/nextjs/commerce";
import type { ComponentProps } from "@/lib/component-props";
import {
  getProductStatusMessage,
  useStarterProduct,
} from "@/hooks/useStarterProduct";
import {
  getSpecIssueMessages,
  toCommerceProductSpec,
  type CommerceProductSpec,
} from "@/lib/commerce/products/specs";
import {
  ProductSpecFields,
  resolveDefaultOptionControl,
} from "@/components/commerce/ProductSpecFields";

const SpecForm: React.FC<
  ComponentProps & { variantDefaultOptionControl?: "dropdown" | "buttons" }
> = ({ params, page, variantDefaultOptionControl }) => {
  const productData = useStarterProduct();
  const productOptions = useProductOptions({ optional: true });
  const selection = useProductSelection({ optional: true });
  const isAuthoring = page.mode.isEditing || page.mode.isDesignLibrary;
  const defaultOptionControl =
    variantDefaultOptionControl ??
    resolveDefaultOptionControl(
      params.DefaultOptionControl ?? params["Default Option Control"],
    );
  const rawSpecs = productOptions?.specs;
  const specs = useMemo(
    () =>
      (rawSpecs ?? []).flatMap((spec): CommerceProductSpec[] => {
        const mapped = toCommerceProductSpec(spec);
        return mapped ? [mapped] : [];
      }),
    [rawSpecs],
  );
  const visibleIssues = selection?.visibleIssues;
  const errors = useMemo(
    () => getSpecIssueMessages(visibleIssues ?? [], rawSpecs ?? []),
    [rawSpecs, visibleIssues],
  );

  if (!productData || !productOptions || !selection) {
    return isAuthoring ? (
      <div className="rounded border border-dashed border-amber-500 p-3 text-sm text-amber-700">
        SpecForm must be placed inside a ProductContainer.
      </div>
    ) : null;
  }

  if (productData.isLoading) {
    return (
      <div
        className={`space-y-4 ${params.styles ?? ""}`}
        id={params.RenderingIdentifier}
        aria-live="polite"
        data-component="SpecForm"
      >
        <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
        <span className="sr-only">Loading product options…</span>
      </div>
    );
  }

  if (!productData.isSuccess || !productData.product) {
    if (!isAuthoring) return null;
    const message =
      getProductStatusMessage(productData, "Unable to load product options.") ??
      "Unable to load product options.";

    return (
      <div className="rounded border border-dashed p-3 text-sm text-slate-600">
        <span className="font-medium">SpecForm:</span> {message}
      </div>
    );
  }

  const optionsStatus = productOptions.status;
  const hasVisibleContent =
    optionsStatus === "loading" ||
    optionsStatus === "error" ||
    (optionsStatus === "success" && specs.length > 0);

  if (!hasVisibleContent) {
    return isAuthoring ? (
      <div
        className={`rounded border border-dashed p-3 text-sm text-slate-600 ${params.styles ?? ""}`}
        id={params.RenderingIdentifier}
        data-component="SpecForm"
      >
        No product options are configured.
      </div>
    ) : null;
  }

  return (
    <div
      className={`space-y-4 border-t border-slate-200 pt-6 ${params.styles ?? ""}`}
      id={params.RenderingIdentifier}
      data-component="SpecForm"
    >
      {optionsStatus === "loading" && (
        <p className="text-sm text-slate-600" aria-live="polite">
          Loading product options…
        </p>
      )}

      {optionsStatus === "error" && (
        <div className="space-y-2 rounded border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700" role="alert">
            {productOptions.error?.message ?? "Unable to load product options."}
          </p>
          <button
            type="button"
            onClick={() => void productOptions.refetch()}
            className="text-sm font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {optionsStatus === "success" && specs.length > 0 && (
        <ProductSpecFields
          specs={specs}
          selections={selection.selections}
          errors={errors}
          defaultOptionControl={defaultOptionControl}
          currency={productData.product.currency}
          disabled={false}
          optionAvailability={productOptions.optionAvailability}
          onChange={selection.setSelection}
        />
      )}
    </div>
  );
};

export const Default: React.FC<ComponentProps> = (props) => (
  <SpecForm {...props} variantDefaultOptionControl="dropdown" />
);

export const Buttons: React.FC<ComponentProps> = (props) => (
  <SpecForm {...props} variantDefaultOptionControl="buttons" />
);
