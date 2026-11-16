import { describe, expect, it, vi } from "vitest";
import type { ProductsApi } from "@sitecore-content-sdk/nextjs/commerce";
import { toCommerceProduct } from "../lib/commerce/products/mapper";
import {
  listProductPage,
  orderProductsByIds,
  toProductListMeta,
  toProductListParams,
  toUniqueProductIds,
} from "../lib/commerce/products/service";

const createApi = (response: unknown) => {
  const list = vi.fn().mockResolvedValue(response);
  return { list: list as unknown as ProductsApi["list"], mock: list };
};

describe("toProductListParams", () => {
  it("maps starter options to SDK list params", () => {
    expect(
      toProductListParams({
        catalogId: " catalog/one ",
        categoryId: " running/shoes ",
        search: " head phones ",
        sortBy: ["!xp.Price"],
        page: 2,
        pageSize: 10,
        filters: { "xp.Facets.Brand": ["Nike"] },
      }),
    ).toEqual({
      catalogID: "catalog/one",
      categoryID: "running/shoes",
      search: "head phones",
      sortBy: ["!xp.Price"],
      page: 2,
      pageSize: 10,
      filters: { "xp.Facets.Brand": ["Nike"] },
    });
  });

  it("drops blank catalog, category and search", () => {
    expect(
      toProductListParams({ catalogId: " ", categoryId: "", search: "  " }),
    ).toMatchObject({
      catalogID: undefined,
      categoryID: undefined,
      search: undefined,
    });
  });
});

describe("toProductListMeta", () => {
  it("maps paging and facets", () => {
    expect(
      toProductListMeta({
        Page: 2,
        PageSize: 10,
        TotalCount: 12,
        TotalPages: 2,
        Facets: [
          {
            Name: "Brand",
            XpPath: "Facets.Brand",
            Values: [
              { Value: "Nike", Count: 8 },
              { Value: "Jordan", Count: 4 },
            ],
          },
          { Name: " ", XpPath: "Facets.Empty", Values: [] },
        ],
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      totalCount: 12,
      totalPages: 2,
      facets: [
        {
          name: "Brand",
          xpPath: "Facets.Brand",
          values: [
            { value: "Nike", count: 8 },
            { value: "Jordan", count: 4 },
          ],
        },
      ],
    });
  });

  it("returns undefined without metadata", () => {
    expect(toProductListMeta(null)).toBeUndefined();
  });
});

describe("listProductPage", () => {
  it("loads one page through the SDK and maps it", async () => {
    const controller = new AbortController();
    const api = createApi({
      Items: [{ ID: "P-1", Name: "Headphones" }],
      Meta: { Page: 1, PageSize: 10, TotalCount: 1, TotalPages: 1 },
    });

    await expect(
      listProductPage(
        api,
        { search: "head", page: 1, pageSize: 10 },
        { signal: controller.signal },
      ),
    ).resolves.toEqual({
      items: [{ id: "P-1", name: "Headphones", images: [] }],
      meta: { page: 1, pageSize: 10, totalCount: 1, totalPages: 1, facets: [] },
    });
    expect(api.mock).toHaveBeenCalledWith(
      { search: "head", page: 1, pageSize: 10 },
      { signal: controller.signal },
    );
  });
});

describe("featured product IDs", () => {
  it("trims and de-duplicates IDs in order", () => {
    expect(toUniqueProductIds([" P-2 ", "P-1", "P-2", "MISSING", ""])).toEqual([
      "P-2",
      "P-1",
      "MISSING",
    ]);
  });

  it("orders products by the requested IDs and skips missing ones", () => {
    const p1 = toCommerceProduct({ ID: "P-1", Name: "P-1" });
    const p2 = toCommerceProduct({ ID: "P-2", Name: "P-2" });
    const p3 = toCommerceProduct({ ID: "P-3", Name: "P-3" });

    expect(
      orderProductsByIds([p1, p2, p3], ["P-2", "P-1", "MISSING"]),
    ).toEqual([p2, p1]);
  });
});

describe("toCommerceProduct", () => {
  it("maps the price schedule", () => {
    expect(
      toCommerceProduct({
        ID: "SKU/123",
        Name: "Headphones",
        PriceSchedule: {
          Currency: "USD",
          PriceBreaks: [{ Quantity: 1, Price: 19.99 }],
        },
      }),
    ).toEqual({
      id: "SKU/123",
      name: "Headphones",
      images: [],
      price: 19.99,
      currency: "USD",
    });
  });

  it("maps the XP schema and moves the primary image first", () => {
    expect(
      toCommerceProduct({
        ID: "SKU-IMAGES",
        Name: "Gallery product",
        xp: {
          Brand: "Jordan",
          Category: "Basketball Lifestyle",
          Price: 189.99,
          Images: [
            { Url: "https://images.example.test/detail.jpg" },
            {
              Url: "https://images.example.test/primary.jpg",
              Thumbnailurl: "https://images.example.test/primary-thumb.jpg",
              Primary: true,
            },
          ],
        },
      }),
    ).toMatchObject({
      imageUrl: "https://images.example.test/primary.jpg",
      thumbnailUrl: "https://images.example.test/primary-thumb.jpg",
      brand: "Jordan",
      category: "Basketball Lifestyle",
      price: 189.99,
      images: [
        {
          url: "https://images.example.test/primary.jpg",
          thumbnailUrl: "https://images.example.test/primary-thumb.jpg",
        },
        { url: "https://images.example.test/detail.jpg" },
      ],
    });
  });

  it("uses the first product image when no primary image is provided", () => {
    expect(
      toCommerceProduct({
        ID: "SKU-NO-PRIMARY",
        Name: "Gallery product",
        xp: {
          Images: [
            { Url: "https://images.example.test/first.jpg" },
            { Url: "https://images.example.test/second.jpg" },
          ],
        },
      }),
    ).toMatchObject({
      imageUrl: "https://images.example.test/first.jpg",
      thumbnailUrl: "https://images.example.test/first.jpg",
    });
  });

  it("falls back to the product ID when the name is blank", () => {
    expect(toCommerceProduct({ ID: "SKU-1", Name: " " })).toMatchObject({
      id: "SKU-1",
      name: "SKU-1",
    });
  });
});
