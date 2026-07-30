export type CommerceProduct = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
};

export type CommerceProductList = {
  items: CommerceProduct[];
};