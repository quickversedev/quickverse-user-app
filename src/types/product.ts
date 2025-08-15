export interface Product {
  id: string;
  name: string;
  price: number;
  mrp: number;
  image: any; // React Native ImageSourcePropType
  rating: number;
  discount: number;
  quantity: number;
  sku?: string;
  shopId?: string;
  gst?: number;
  category?: string;
  division?: string;
  subDivision?: string;
  brand?: string;
  description?: string;
  imageUrl?: string;
  numberOfVariants?: number;
  currentStock?: number;
  inStock?: boolean;
  primarySKU?: string;
  attributes?: {
    color: string | null;
    id: string | null;
    name: string | null;
    description: string | null;
    price: number | null;
    product: string | null;
  };
  additionalImages?: Array<{
    url: string | null;
    id: string | null;
  }>;
  variantAttributes?: Array<{
    name: string;
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
