export interface CommerceCart {
  id: string;
  status: 'Unsubmitted';
  currency?: string;
  subtotal?: number;
  taxCost?: number;
  total?: number;
  isCalculated: boolean;
}
