import type {
  ListMeta,
  ListPage,
  ProductsApi,
} from "@sitecore-content-sdk/nextjs/commerce";
import { hasProductId, toCommerceProduct } from "./mapper";
import type {
  CommerceProduct,
  CommerceProductFacet,
  CommerceProductList,
  CommerceProductXp,
  ListProductsOptions,
  ProductRequestOptions,
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

const toMeta = (meta: ListMeta | undefined): CommerceProductList["meta"] =>
  meta
    ? {
        page: asPositiveInteger(meta.Page),
        pageSize: asPositiveInteger(meta.PageSize),
        totalCount: asNonNegativeInteger(meta.TotalCount),
        totalPages: asNonNegativeInteger(meta.TotalPages),
        facets: toFacets(meta),
      }
    : undefined;

const toProducts = (page: ListPage<unknown>): CommerceProduct[] =>
  (Array.isArray(page?.Items) ? page.Items : [])
    .filter(hasProductId)
    .map(toCommerceProduct);

/**
 * Product list reads for listing components and the product picker, on the SDK shopper session.
 * Single-product reads (product, specs, variants) go through the SDK `ProductProvider`.
 */
export class ProductsService {
  constructor(private readonly api: Pick<ProductsApi, "list">) {}

  async list(options: ListProductsOptions = {}): Promise<CommerceProductList> {
    const response = await this.api.list<CommerceProductXp>(
      {
        catalogID: options.catalogId?.trim() || undefined,
        categoryID: options.categoryId?.trim() || undefined,
        search: options.search?.trim() || undefined,
        sortBy: options.sortBy,
        page: options.page,
        pageSize: options.pageSize,
        filters: options.filters,
      },
      { signal: options.signal },
    );

    return { items: toProducts(response), meta: toMeta(response?.Meta) };
  }

  async listByIds(
    productIds: string[],
    options: ProductRequestOptions = {},
  ): Promise<CommerceProductList> {
    const uniqueIds = [
      ...new Set(
        productIds
          .map((productId) => productId.trim())
          .filter((productId) => productId.length > 0),
      ),
    ];

    if (uniqueIds.length === 0) {
      return { items: [], meta: { totalCount: 0 } };
    }

    const response = await this.api.list<CommerceProductXp>(
      { pageSize: uniqueIds.length, filters: { ID: uniqueIds } },
      { signal: options.signal },
    );
    const productsById = new Map(
      toProducts(response).map((product): [string, CommerceProduct] => [
        product.id,
        product,
      ]),
    );
    const items = uniqueIds.flatMap((productId) => {
      const product = productsById.get(productId);
      return product ? [product] : [];
    });

    return { items, meta: { totalCount: items.length } };
  }
}
