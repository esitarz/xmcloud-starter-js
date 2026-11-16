import type { CommerceProduct, OrderCloudBuyerProduct } from "./types";
import { asFiniteNumber, asNonEmptyString, asRecord } from "../normalization";
import { getProductImages, toProductHeroImage } from "./images";

const getPrice = (value: unknown): { price?: number; currency?: string } => {
  const priceSchedule = asRecord(value);
  const priceBreaks = Array.isArray(priceSchedule?.PriceBreaks)
    ? priceSchedule.PriceBreaks
    : [];
  const firstPriceBreak = asRecord(priceBreaks[0]);

  return {
    price: asFiniteNumber(firstPriceBreak?.Price, { allowNumericString: true }),
    currency: asNonEmptyString(priceSchedule?.Currency),
  };
};

/**
 * Maps a raw OrderCloud buyer product to the starter's view model, applying the site's `xp`
 * conventions (`xp.Images`, `xp.Brand`, `xp.Category`, `xp.Price` fallback).
 * Used as the SDK `ProductProvider` `select` and for product lists. Module-scoped so it stays
 * referentially stable.
 */
export const toCommerceProduct = (
  product: OrderCloudBuyerProduct,
): CommerceProduct => {
  const xp = asRecord(product.xp);
  const price = getPrice(product.PriceSchedule ?? product.DefaultPriceSchedule);
  const images = getProductImages(xp);

  return {
    id: product.ID,
    name: asNonEmptyString(product.Name, { trim: true }) ?? product.ID,
    description: asNonEmptyString(product.Description),
    ...toProductHeroImage(images),
    images,
    brand: asNonEmptyString(xp?.Brand),
    category: asNonEmptyString(xp?.Category),
    price:
      price.price ?? asFiniteNumber(xp?.Price, { allowNumericString: true }),
    currency: price.currency,
  };
};
