import { describe, expect, it, vi } from "vitest";
import type { ProductsApi } from "@sitecore-content-sdk/nextjs/commerce";
import { toCommerceProduct } from "../lib/commerce/products/mapper";
import { ProductsService } from "../lib/commerce/products/service";

const createApi = (response: unknown) => {
  const list = vi.fn().mockResolvedValue(response);
  return { list: list as unknown as ProductsApi["list"], mock: list };
};

describe("ProductsService", () => {
  it("searches the buyer catalog through the SDK and maps metadata", async () => {
    const controller = new AbortController();
    const api = createApi({
      Items: [{ ID: "P-1", Name: "Headphones" }],
      Meta: {
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
        ],
      },
    });

    await expect(
      new ProductsService(api).list({
        catalogId: " catalog/one ",
        categoryId: " running/shoes ",
        search: "head phones",
        sortBy: ["!xp.Price"],
        page: 2,
        pageSize: 10,
        filters: { "xp.Facets.Brand": ["Nike"] },
        signal: controller.signal,
      }),
    ).resolves.toEqual({
      items: [{ id: "P-1", name: "Headphones", images: [] }],
      meta: {
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
      },
    });
    expect(api.mock).toHaveBeenCalledWith(
      {
        catalogID: "catalog/one",
        categoryID: "running/shoes",
        search: "head phones",
        sortBy: ["!xp.Price"],
        page: 2,
        pageSize: 10,
        filters: { "xp.Facets.Brand": ["Nike"] },
      },
      { signal: controller.signal },
    );
  });

  it("skips list entries without a product ID", async () => {
    const api = createApi({
      Items: [{ ID: " ", Name: "Broken" }, { Name: "No ID" }, { ID: "P-3" }],
      Meta: { TotalCount: 3 },
    });

    await expect(new ProductsService(api).list()).resolves.toMatchObject({
      items: [{ id: "P-3", name: "P-3", images: [] }],
    });
  });

  it("loads selected products by ID in order and skips missing ones", async () => {
    const api = createApi({
      Items: [
        { ID: "P-1", Name: "P-1" },
        { ID: "P-2", Name: "P-2" },
      ],
      Meta: { TotalCount: 2 },
    });

    await expect(
      new ProductsService(api).listByIds([" P-2 ", "P-1", "P-2", "MISSING", ""]),
    ).resolves.toEqual({
      items: [
        { id: "P-2", name: "P-2", images: [] },
        { id: "P-1", name: "P-1", images: [] },
      ],
      meta: { totalCount: 2 },
    });
    expect(api.mock).toHaveBeenCalledOnce();
    expect(api.mock).toHaveBeenCalledWith(
      { pageSize: 3, filters: { ID: ["P-2", "P-1", "MISSING"] } },
      { signal: undefined },
    );
  });

  it("returns an empty list without requesting products", async () => {
    const api = createApi({ Items: [], Meta: {} });

    await expect(new ProductsService(api).listByIds([" ", ""])).resolves.toEqual({
      items: [],
      meta: { totalCount: 0 },
    });
    expect(api.mock).not.toHaveBeenCalled();
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
