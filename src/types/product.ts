export interface Product {
  name: string;
  mrp: number;
  rating: number;
  discount: number;
  veg: boolean;
  sellingPrice: number;
  sku: string;
  shopId: string;
  shopName?: string;
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
    id?: string;
    label?: string;
    tagName: string;
  }>;
}

/**
 * An entry in the server's tag vocabulary (GET /v3/product-tags). Backed by the
 * product_tag table, so a new tag arrives here without an app release — which is why
 * imageUrl is a URL rather than a bundled asset and why nothing keys off `id`.
 */
export interface ProductTagOption {
  id: string;
  label: string;
  /** Absent until an admin uploads one; the chip falls back to an initial. */
  imageUrl?: string;
  /** False for the virtual price bands, which are derived from price. */
  assignable?: boolean;
  /** The band's ceiling for a price tag; absent on an ordinary one. */
  maxPrice?: number;
  displayOrder?: number;
  active?: boolean;
  /** Only present when the request asked for counts. */
  productCount?: number;
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
