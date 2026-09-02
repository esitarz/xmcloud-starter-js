export interface CommerceCart {
  id: string;
  status: 'Unsubmitted';
  currency?: string;
  subtotal?: number;
  taxCost?: number;
  total?: number;
  isCalculated: boolean;
}

export interface AddCartItemInput {
  orderId: string;
  productId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  orderId: string;
  lineItemId: string;
  quantity: number;
}
