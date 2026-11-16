import type {
  ListMeta,
  ListProductsOptions as SdkListProductsOptions,
  ProductsApi,
} from "@sitecore-content-sdk/nextjs/commerce";
import { toCommerceProduct } from "./mapper";
import type {
  CommerceProduct,
  CommerceProductFacet,
  CommerceProductList,
  CommerceProductXp,
  ListProductsOptions,
} from "./types";

const asPositiveInteger = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;

const asNonNegativeInteger = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;

const trimmed = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toFacets = (meta: ListMeta): CommerceProductFacet[] =>
  (Array.isArray(meta.Facets) ? meta.Facets : []).flatMap((facet) => {
    const name = trimmed(facet?.Name);
    const xpPath = trimmed(facet?.XpPath);
    if (!name || !xpPath) return [];

    const values = (Array.isArray(facet.Values) ? facet.Values : []).flatMap(
      (item) => {
        const value = trimmed(item?.Value);
        const count = asNonNegativeInteger(item?.Count);
        return value && count !== undefined ? [{ value, count }] : [];
      },
    );
    return [{ name, xpPath, values }];
  });

/** Maps SDK list metadata (paging, raw `Facets`) to the starter's list meta. */
export const toProductListMeta = (
  meta: ListMeta | null | undefined,
): CommerceProductList["meta"] =>
  meta
    ? {
        page: asPositiveInteger(meta.Page),
        pageSize: asPositiveInteger(meta.PageSize),
        totalCount: asNonNegativeInteger(meta.TotalCount),
        totalPages: asNonNegativeInteger(meta.TotalPages),
        facets: toFacets(meta),
      }
    : undefined;

/** Maps the starter's list options to SDK `products.list` / `useProducts` params. */
export const toProductListParams = (
  options: ListProductsOptions = {},
): SdkListProductsOptions => ({
  catalogID: options.catalogId?.trim() || undefined,
  categoryID: options.categoryId?.trim() || undefined,
  search: options.search?.trim() || undefined,
  sortBy: options.sortBy,
  page: options.page,
  pageSize: options.pageSize,
  filters: options.filters,
});

/** Trimmed, de-duplicated product IDs in their original order. */
export const toUniqueProductIds = (productIds: string[]): string[] => [
  ...new Set(
    productIds
      .map((productId) => productId.trim())
      .filter((productId) => productId.length > 0),
  ),
];

/** Orders `products` by `productIds`, dropping products that were not requested. */
export const orderProductsByIds = (
  products: CommerceProduct[],
  productIds: string[],
): CommerceProduct[] => {
  const productsById = new Map(
    products.map((product): [string, CommerceProduct] => [product.id, product]),
  );
  return productIds.flatMap((productId) => {
    const product = productsById.get(productId);
    return product ? [product] : [];
  });
};

/**
 * One page of products through the SDK `products.list`. Only for lists that append pages
 * (infinite scroll), which `useProducts` does not support; everything else uses `useProducts`.
 */
export const listProductPage = async (
  api: Pick<ProductsApi, "list">,
  params: SdkListProductsOptions,
  options: { signal?: AbortSignal } = {},
): Promise<CommerceProductList> => {
  const response = await api.list<CommerceProductXp>(params, options);
  return {
    items: (Array.isArray(response?.Items) ? response.Items : []).map(
      toCommerceProduct,
    ),
    meta: toProductListMeta(response?.Meta),
  };
};
