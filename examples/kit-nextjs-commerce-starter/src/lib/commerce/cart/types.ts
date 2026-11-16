import type { ProductLineItemDraft } from '@sitecore-content-sdk/nextjs/commerce';

export interface CommerceCartItemSpec {
  specId: string;
  name?: string;
  optionId?: string;
  value?: string;
}

export interface CommerceCartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  specs?: CommerceCartItemSpec[];
}

export interface CommerceCart {
  id?: string;
  status: 'Unsubmitted';
  currency?: string;
  subtotal?: number;
  taxCost?: number;
  total?: number;
  isCalculated: boolean;
  items: CommerceCartItem[];
}

/** SDK `getLineItemDraft()` result plus quantity (the shape M3 `addLineItem` will accept). */
export type AddCartItemInput = ProductLineItemDraft & { Quantity: number };

export interface UpdateCartItemInput {
  lineItemId: string;
  quantity: number;
}
