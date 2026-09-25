import type { LineItem } from "ordercloud-javascript-sdk";
import { toCommerceCart, type OrderCloudCart } from "./mapper";
import type {
  AddCartItemInput,
  CommerceCart,
  UpdateCartItemInput,
} from "./types";

/**
 * Sends an authorized OrderCloud buyer request (e.g. `/v1/cart`) as the current shopper.
 * In the browser this is the SDK `OrderCloudService.request`; on the server it forwards the
 * shopper's bearer token (see `cart/server.ts`).
 */
export type CartRequest = <T>(
  path: `/v1/${string}`,
  init?: RequestInit,
) => Promise<T>;

type LineItemList = { Items?: LineItem[] };

const json = (body: unknown): Pick<RequestInit, "body" | "headers"> => ({
  body: JSON.stringify(body),
  headers: { "Content-Type": "application/json" },
});

const lineItemPath = (lineItemId: string): `/v1/${string}` =>
  `/v1/cart/lineitems/${encodeURIComponent(lineItemId)}`;

// Cart calls go through `request()` until the SDK ships typed cart APIs (M3).
export class CartService {
  constructor(private readonly request: CartRequest) {}

  async get(): Promise<CommerceCart> {
    const [order, lineItems] = await Promise.all([
      this.request<OrderCloudCart>("/v1/cart", { method: "GET" }),
      this.request<LineItemList>("/v1/cart/lineitems?pageSize=100", {
        method: "GET",
      }),
    ]);
    return toCommerceCart(order, lineItems);
  }

  async addItem(input: AddCartItemInput): Promise<void> {
    // OrderCloud resolves the variant from Specs; VariantID is informational.
    const lineItem = {
      ProductID: input.ProductID,
      Quantity: input.Quantity,
      ...(input.Specs.length ? { Specs: input.Specs } : {}),
    } satisfies LineItem;
    await this.request("/v1/cart/lineitems", {
      method: "POST",
      ...json(lineItem),
    });
  }

  async updateItem(input: UpdateCartItemInput): Promise<void> {
    await this.request(lineItemPath(input.lineItemId), {
      method: "PATCH",
      ...json({ Quantity: input.quantity }),
    });
  }

  async removeItem(lineItemId: string): Promise<void> {
    await this.request(lineItemPath(lineItemId), { method: "DELETE" });
  }

  async markCheckoutPending(input: {
    clientId: string;
    stripeSessionId: string;
  }): Promise<void> {
    await this.request("/v1/cart", {
      method: "PATCH",
      ...json({
        xp: {
          CheckoutStatus: "Pending",
          ocClientId: input.clientId,
          stripeSessionId: input.stripeSessionId,
        },
      }),
    });
  }
}
