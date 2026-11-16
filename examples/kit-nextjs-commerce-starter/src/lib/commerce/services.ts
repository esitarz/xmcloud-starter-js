import type { OrderCloudService } from "@sitecore-content-sdk/nextjs/commerce";
import { CartService } from "./cart/service";

export interface OrderCloudServices {
  cart: CartService;
}

/** Starter services bound to the SDK `OrderCloudService` (one shopper identity). */
export const createOrderCloudServices = (
  service: OrderCloudService,
): OrderCloudServices => ({
  cart: new CartService((path, init) => service.request(path, init)),
});

/** Services that reject with `error`; used when the SDK provider is misconfigured. */
export const createUnavailableServices = (error: Error): OrderCloudServices => {
  const reject = () => Promise.reject(error);
  return {
    cart: new CartService(reject),
  };
};
