import type React from "react";
import { AppPlaceholder } from "@sitecore-content-sdk/nextjs";
import componentMap from ".sitecore/component-map";
import ProductContainerContent from "@/components/commerce/ProductContainerContent";
import type { ProductContainerProps } from "./product-container.props";
import {
  hasProductContainerContent,
  resolveProductContainerSettings,
} from "@/lib/commerce/products/container-settings";
import { ProductDetailFallback } from "@/lib/commerce/products/ProductDetailFallback";

export const Default: React.FC<ProductContainerProps> = ({
  fields,
  params,
  rendering,
  page,
}) => {
  const route = page.layout.sitecore.route;
  const {
    source,
    selectedProduct,
    previewProduct,
    dataSource,
    fieldName: authoringFieldName,
    authoringValue: authoringProduct,
  } = resolveProductContainerSettings({
    fields,
    routeFields: route?.fields,
    routeItemId: route?.itemId,
    renderingDataSource: rendering.dataSource,
  });
  const placeholderName = `product-container-${params.DynamicPlaceholderId ?? "0"}`;
  const isPreview =
    page.mode.isEditing || page.mode.isPreview || page.mode.isDesignLibrary;
  const isAuthoring = page.mode.isEditing || page.mode.isDesignLibrary;
  const language = page.layout.sitecore.route?.itemLanguage ?? page.locale;
  const authoringField =
    isAuthoring && authoringFieldName && dataSource
      ? {
          dataSource,
          fieldName: authoringFieldName,
          helpText:
            source === "last-url-segment"
              ? "The live product comes from the URL. This product is used only to preview the wildcard page while editing."
              : "This product will be rendered on the live site",
          initialIds: authoringProduct ? [authoringProduct.id] : [],
          language,
          mode: "single" as const,
          title:
            source === "last-url-segment"
              ? "Preview product"
              : "Selected product",
        }
      : undefined;

  return (
    <section
      className={params.styles ?? ""}
      id={params.RenderingIdentifier}
      data-component="ProductContainer"
      data-class-change
    >
      <ProductContainerContent
        source={source}
        selectedProduct={selectedProduct}
        previewProduct={previewProduct}
        isAuthoring={isPreview}
        showAuthoringField={isAuthoring}
        authoringField={authoringField}
      >
        {!hasProductContainerContent(rendering.placeholders) && (
          <ProductDetailFallback
            rendering={rendering}
            params={params}
            page={page}
          />
        )}
        <AppPlaceholder
          name={placeholderName}
          rendering={rendering}
          page={page}
          componentMap={componentMap}
        />
      </ProductContainerContent>
    </section>
  );
};
