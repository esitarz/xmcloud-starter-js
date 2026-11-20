import type { ComponentRendering } from "@sitecore-content-sdk/nextjs";
import {
  normalizeProductSource,
  parseProductReference,
} from "@/lib/commerce/products/reference";

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const getDatasource = (fields: unknown): Record<string, unknown> => {
  const root = asRecord(fields) ?? {};
  const data = asRecord(root.data);
  return asRecord(data?.datasource) ?? root;
};

const getNamedField = (
  fields: Record<string, unknown>,
  names: string[],
): unknown => {
  for (const name of names) {
    if (fields[name] !== undefined) return fields[name];
  }
  return undefined;
};

const getFieldValue = (field: unknown): unknown => {
  const record = asRecord(field);
  if (!record) return field;
  const jsonValue = asRecord(record.jsonValue);
  if (jsonValue && "value" in jsonValue) return jsonValue.value;
  return "value" in record ? record.value : field;
};

const fieldValueFrom = (
  fields: Record<string, unknown>,
  names: string[],
): unknown => getFieldValue(getNamedField(fields, names));

const sourceFromRoutePathField = (value: unknown) => {
  if (value === true || value === "1" || value === "true")
    return "last-url-segment" as const;
  if (value === false || value === "0" || value === "false")
    return "ordercloud-picker" as const;
  return undefined;
};

/**
 * Resolves ProductContainer configuration from either the legacy rendering datasource or route
 * fields owned by the page item.
 */
export const resolveProductContainerSettings = ({
  fields,
  routeFields,
  routeItemId,
  renderingDataSource,
}: {
  fields: unknown;
  routeFields: unknown;
  routeItemId?: string;
  renderingDataSource?: string;
}) => {
  const datasource = getDatasource(fields);
  const route = asRecord(routeFields) ?? {};
  const routeFieldNames = [
    "Use Route Path",
    "Product ID",
    "Product Preview ID",
    "Preview Product ID",
  ];
  const usesRouteFields = routeFieldNames.some(
    (name) => route[name] !== undefined,
  );
  const configuration = usesRouteFields ? route : datasource;
  const source =
    sourceFromRoutePathField(
      fieldValueFrom(configuration, ["Use Route Path"]),
    ) ??
    normalizeProductSource(
      fieldValueFrom(configuration, [
        "productSource",
        "ProductSource",
        "Product Source",
      ]),
    );
  const selectedProduct = parseProductReference(
    fieldValueFrom(configuration, ["productId", "ProductId", "Product ID"]),
  );
  const previewProduct = parseProductReference(
    fieldValueFrom(configuration, [
      "previewProductId",
      "PreviewProductId",
      "Product Preview ID",
      "Preview Product ID",
    ]),
  );
  const fieldName =
    source === "ordercloud-picker"
      ? "Product ID"
      : source === "last-url-segment"
        ? usesRouteFields
          ? "Product Preview ID"
          : "Preview Product ID"
        : undefined;

  return {
    source,
    selectedProduct,
    previewProduct,
    dataSource: usesRouteFields ? routeItemId : renderingDataSource,
    fieldName,
    authoringValue:
      source === "last-url-segment" ? previewProduct : selectedProduct,
  };
};

export const hasProductContainerContent = (
  placeholders: ComponentRendering["placeholders"],
): boolean =>
  Object.values(placeholders ?? {}).some(
    (renderings) => Array.isArray(renderings) && renderings.length > 0,
  );
