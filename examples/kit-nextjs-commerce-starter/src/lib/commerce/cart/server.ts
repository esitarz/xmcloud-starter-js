import "server-only";
import { orderCloudRequest } from "../auth/client";
import { CartService } from "./service";
import type { CommerceCart } from "./types";

// Server routes act on behalf of the shopper with the SDK session access token the browser sent.
const createShopperCartService = (shopperToken: string): CartService =>
  new CartService((path, init = {}) =>
    orderCloudRequest(
      path,
      { method: init.method, headers: init.headers, body: init.body },
      shopperToken,
    ),
  );

export const getCart = async (shopperToken: string): Promise<CommerceCart> =>
  createShopperCartService(shopperToken).get();

export const markCartCheckoutPending = async (
  shopperToken: string,
  input: { clientId: string; stripeSessionId: string },
): Promise<void> =>
  createShopperCartService(shopperToken).markCheckoutPending(input);
