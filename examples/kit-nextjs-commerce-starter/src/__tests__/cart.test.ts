import { describe, expect, it, vi } from "vitest";
import { CartService, type CartRequest } from "../lib/commerce/cart/service";

const createRequest = (
  handler: (path: string, init?: RequestInit) => unknown = () => ({}),
) => {
  const mock = vi.fn(async (path: string, init?: RequestInit) =>
    handler(path, init),
  );
  return { request: mock as unknown as CartRequest, mock };
};

const bodyOf = (init?: RequestInit) => JSON.parse(String(init?.body));

describe("CartService", () => {
  it("loads and normalizes the active cart and its line items together", async () => {
    const { request, mock } = createRequest((path) =>
      path === "/v1/cart"
        ? {
            ID: "cart-1",
            Status: "Unsubmitted",
            Currency: "USD",
            Subtotal: 25,
            Total: 27,
            IsCalculated: true,
          }
        : {
            Items: [
              {
                ID: "line-1",
                ProductID: "SKU-1",
                Product: { Name: "Configured product" },
                Quantity: 2,
                UnitPrice: 12.5,
              },
            ],
          },
    );

    await expect(new CartService(request).get()).resolves.toEqual({
      id: "cart-1",
      status: "Unsubmitted",
      currency: "USD",
      subtotal: 25,
      taxCost: undefined,
      total: 27,
      isCalculated: true,
      items: [
        {
          id: "line-1",
          productId: "SKU-1",
          name: "Configured product",
          quantity: 2,
          unitPrice: 12.5,
        },
      ],
    });
    expect(mock).toHaveBeenCalledWith("/v1/cart", { method: "GET" });
    expect(mock).toHaveBeenCalledWith("/v1/cart/lineitems?pageSize=100", {
      method: "GET",
    });
  });

  it("posts the line item with selected specs", async () => {
    const { request, mock } = createRequest();

    await new CartService(request).addItem({
      ProductID: "SKU-123",
      VariantID: "SKU-123-S",
      Quantity: 2,
      Specs: [
        { SpecID: "SIZE", OptionID: "SMALL" },
        { SpecID: "ENGRAVING", Value: "Codex" },
      ],
    });

    const [path, init] = mock.mock.calls[0];
    expect(path).toBe("/v1/cart/lineitems");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Content-Type")).toBe(
      "application/json",
    );
    expect(bodyOf(init)).toEqual({
      ProductID: "SKU-123",
      Quantity: 2,
      Specs: [
        { SpecID: "SIZE", OptionID: "SMALL" },
        { SpecID: "ENGRAVING", Value: "Codex" },
      ],
    });
  });

  it("deletes a leftover cart and retries add after a 409", async () => {
    let attempts = 0;
    const { request, mock } = createRequest((path, init) => {
      if (path === "/v1/cart/lineitems" && attempts++ === 0) {
        throw Object.assign(new Error("Object already exists"), {
          status: 409,
        });
      }
      return init?.method === "DELETE" ? "" : {};
    });

    await new CartService(request).addItem({
      ProductID: "SKU-123",
      Quantity: 1,
      Specs: [],
    });

    expect(mock).toHaveBeenCalledWith("/v1/cart", { method: "DELETE" });
    expect(
      mock.mock.calls.filter(([path]) => path === "/v1/cart/lineitems"),
    ).toHaveLength(2);
  });

  it("does not retry other add failures", async () => {
    const { request, mock } = createRequest(() => {
      throw Object.assign(new Error("Bad request"), { status: 400 });
    });

    await expect(
      new CartService(request).addItem({
        ProductID: "SKU-123",
        Quantity: 1,
        Specs: [],
      }),
    ).rejects.toThrow("Bad request");
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("updates and removes line items by encoded ID", async () => {
    const { request, mock } = createRequest();
    const service = new CartService(request);

    await service.updateItem({ lineItemId: "line/1", quantity: 3 });
    await service.removeItem("line/1");

    expect(mock.mock.calls[0][0]).toBe("/v1/cart/lineitems/line%2F1");
    expect(mock.mock.calls[0][1]?.method).toBe("PATCH");
    expect(bodyOf(mock.mock.calls[0][1])).toEqual({ Quantity: 3 });
    expect(mock.mock.calls[1]).toEqual([
      "/v1/cart/lineitems/line%2F1",
      { method: "DELETE" },
    ]);
  });

  it("marks checkout as pending on the unsubmitted cart", async () => {
    const { request, mock } = createRequest();

    await new CartService(request).markCheckoutPending({
      clientId: "buyer-client-id",
      stripeSessionId: "cs_test_123",
    });

    const [path, init] = mock.mock.calls[0];
    expect(path).toBe("/v1/cart");
    expect(init?.method).toBe("PATCH");
    expect(bodyOf(init)).toEqual({
      xp: {
        CheckoutStatus: "Pending",
        ocClientId: "buyer-client-id",
        stripeSessionId: "cs_test_123",
      },
    });
  });
});
