import type React from "react";
import type { ComponentProps } from "@/lib/component-props";
import { Default as AddToCart } from "@/components/add-to-cart/AddToCart";
import { Default as ProductImageGallery } from "@/components/product-image-gallery/ProductImageGallery";
import { Default as ProductInfo } from "@/components/product-info/ProductInfo";
import { Default as SpecForm } from "@/components/spec-form/SpecForm";

const withRenderingIdentifier = (
  params: ComponentProps["params"],
  suffix: string,
): ComponentProps["params"] => {
  const childParams: ComponentProps["params"] = { ...params, styles: "" };
  if (params.RenderingIdentifier) {
    childParams.RenderingIdentifier = `${params.RenderingIdentifier}-${suffix}`;
  }
  return childParams;
};

export const ProductDetailFallback: React.FC<ComponentProps> = ({
  params,
  rendering,
  page,
}) => (
  <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
    <ProductImageGallery
      rendering={rendering}
      page={page}
      params={withRenderingIdentifier(params, "gallery")}
    />
    <div className="space-y-6">
      <ProductInfo
        rendering={rendering}
        page={page}
        params={withRenderingIdentifier(params, "info")}
      />
      <SpecForm
        rendering={rendering}
        page={page}
        params={withRenderingIdentifier(params, "specs")}
      />
      <AddToCart
        rendering={rendering}
        page={page}
        params={withRenderingIdentifier(params, "add-to-cart")}
      />
    </div>
  </div>
);
