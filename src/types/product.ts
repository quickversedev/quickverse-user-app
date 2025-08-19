export interface Product {
  name: string;
  mrp: number;
  rating: number;
  discount: number;
  veg: boolean;
  sellingPrice: number;
  sku: string;
  shopId: string;
  gst?: number;
  category?: string;
  division?: string;
  subDivision?: string;
  brand?: string;
  imageUrl?: string;
  deactivated?: boolean;
  numberOfVariants: number;
  currentStock?: number;
  buyableQuantity?: number;
  inStock?: boolean;
  searchAlias?: string;
  primarySKU: string;
  attributes?: {
    color: string | null;
    size: string | null;
    name: string | null;
    description: string | null;
    price: number | null;
    unit: string | null;
  };
  additionalImages?: Array<{
    url: string | null;
  }>;

  tags?: Array<{
    tagName: string;
  }>;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  imageURLs: string[] | null;
  type: 'MANAGED' | 'CUSTOM';
  parentCategory: string | null;
  countOfSkus: number;
}
