"use client";

import { useState, type FormEvent } from "react";
import type React from "react";
import Link from "next/link";
import type { ComponentProps } from "@/lib/component-props";
import {
  useProductOptions,
  useProductSelection,
} from "@sitecore-content-sdk/nextjs/commerce";
import { useOrderCloud } from "@/contexts/OrderCloudContext";
import { hasCommerceStatus } from "@/lib/commerce/errors";
import {
  getProductStatusMessage,
  useStarterProduct,
} from "@/hooks/useStarterProduct";
import { getCartDestinationFromRoute } from "@/lib/commerce/cart/destination";
import { getSpecIssueMessage } from "@/lib/commerce/products/specs";

type SubmissionStatus = "idle" | "adding" | "added" | "error";

export const Default: React.FC<ComponentProps> = ({ params, page }) => {
  const productData = useStarterProduct();
  const productOptions = useProductOptions({ optional: true });
  const selection = useProductSelection({ optional: true });
  const { cart, resetSession } = useOrderCloud();
  const isAuthoring =
    page.mode.isEditing || page.mode.isPreview || page.mode.isDesignLibrary;
  const cartHref = getCartDestinationFromRoute(
    page.layout?.sitecore?.route,
  ).href;
  const [quantity, setQuantity] = useState("1");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionStatus>("idle");
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null,
  );
  const productId = productData?.productId;
  const selections = selection?.selections;
  const [seenProductId, setSeenProductId] = useState(productId);
  const [seenSelections, setSeenSelections] = useState(selections);

  if (seenProductId !== productId) {
    setSeenProductId(productId);
    setQuantity("1");
    setQuantityError(null);
  }
  if (seenProductId !== productId || seenSelections !== selections) {
    setSeenSelections(selections);
    setSubmissionStatus("idle");
    setSubmissionMessage(null);
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !selection ||
      !productId ||
      productOptions?.status !== "success" ||
      isAuthoring
    ) {
      return;
    }

    const isComplete = selection.validate();
    const normalizedQuantity = Number(quantity);
    const hasValidQuantity =
      Number.isInteger(normalizedQuantity) && normalizedQuantity >= 1;
    setQuantityError(
      hasValidQuantity ? null : "Enter a quantity of at least 1.",
    );
    const draft = isComplete ? selection.getLineItemDraft() : null;
    if (!draft) {
      const productIssue = selection.issues.find((issue) => !issue.specId);
      setSubmissionStatus("error");
      setSubmissionMessage(
        productIssue
          ? getSpecIssueMessage(productIssue)
          : "Select the required product options.",
      );
      return;
    }
    if (!hasValidQuantity) return;

    const addItem = () =>
      cart.addItem({ ...draft, Quantity: normalizedQuantity });

    setSubmissionStatus("adding");
    setSubmissionMessage(null);
    try {
      try {
        await addItem();
      } catch (error) {
        if (!hasCommerceStatus(error, 409)) throw error;
        await resetSession();
        await addItem();
      }
      setSubmissionStatus("added");
      setSubmissionMessage("Added to cart");
    } catch (error) {
      setSubmissionStatus("error");
      setSubmissionMessage(
        error instanceof Error
          ? error.message
          : "Unable to add product to cart",
      );
    }
  };

  if (!productData || !selection) {
    return isAuthoring ? (
      <div className="rounded border border-dashed border-amber-500 p-3 text-sm text-amber-700">
        AddToCart must be placed inside a ProductContainer.
      </div>
    ) : null;
  }

  if (productData.isLoading) {
    return (
      <div
        className={`space-y-4 ${params.styles ?? ""}`}
        id={params.RenderingIdentifier}
        aria-live="polite"
        data-component="AddToCart"
      >
        <div className="h-12 w-36 animate-pulse rounded bg-slate-100" />
        <span className="sr-only">Loading add to cart…</span>
      </div>
    );
  }

  if (!productData.isSuccess || !productData.product) {
    if (!isAuthoring) return null;
    const message =
      getProductStatusMessage(productData, "Unable to load add to cart.") ??
      "Unable to load add to cart.";

    return (
      <div className="rounded border border-dashed p-3 text-sm text-slate-600">
        <span className="font-medium">AddToCart:</span> {message}
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className={`space-y-4 border-t border-slate-200 pt-6 ${params.styles ?? ""}`}
      id={params.RenderingIdentifier}
      data-component="AddToCart"
      noValidate
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="block space-y-2">
          <span className="text-sm font-medium">Quantity</span>
          <input
            type="number"
            min={1}
            step={1}
            value={quantity}
            disabled={isAuthoring || submissionStatus === "adding"}
            aria-describedby={
              quantityError ? "product-quantity-error" : undefined
            }
            onChange={(event) => {
              setQuantity(event.currentTarget.value);
              setQuantityError(null);
              setSubmissionStatus("idle");
              setSubmissionMessage(null);
            }}
            className="w-24 rounded-md border border-slate-300 px-3 py-3"
          />
        </label>
        <button
          type="submit"
          disabled={
            !selection.isComplete ||
            isAuthoring ||
            submissionStatus === "adding"
          }
          className="min-h-12 flex-1 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submissionStatus === "adding" ? "Adding…" : "Add to cart"}
        </button>
      </div>
      {quantityError && (
        <p
          id="product-quantity-error"
          className="text-sm text-red-700"
          role="alert"
        >
          {quantityError}
        </p>
      )}

      {submissionMessage && (
        <p
          className={
            submissionStatus === "error"
              ? "text-sm text-red-700"
              : "text-sm text-emerald-700"
          }
          role={submissionStatus === "error" ? "alert" : "status"}
        >
          {submissionMessage}
          {submissionStatus === "added" && (
            <>
              {" "}
              <Link href={cartHref} className="font-semibold underline">
                View cart
              </Link>
            </>
          )}
        </p>
      )}
    </form>
  );
};
