import axiosInstance, { apiCall, getAuthHeader } from '../config/api/axios.config';

/**
 * Curated grocery product groups.
 *
 * Worth knowing where this data comes from, because it is unlike the rest of the
 * grocery catalogue: groups are a QuickVerse table (`qv.product_group`, with
 * `qv.product.product_group_id` pointing at it), so this endpoint reads our own
 * database. The category rail and the grocery product grids do not — they are proxied
 * from SmartBiz and SmartPOS, which is why those surfaces have no ratings or tags and
 * default `veg` (QV-13, QV-07).
 *
 * A group deliberately spans shops: its products carry their own `shopId`/`shopName`
 * and may come from several kiranas.
 */

export interface GroceryGroupProduct {
  sku: string;
  /** The product's own shop, not the group's — a group can mix them. */
  shopId: string;
  shopName: string;
  name: string;
  mrp: number;
  sellingPrice: number;
  imageUrl: string;
  inStock: boolean;
}

export interface GroceryGroup {
  groupId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  productCount: number;
  lowestSellingPrice: number;
  /**
   * Products arrive embedded rather than behind a second call — there is no
   * `/v3/grocery/product-groups/{groupId}`, it returns 404. One request is the whole
   * section.
   */
  products: GroceryGroupProduct[];
}

class GroceryGroupsService {
  /**
   * Groups with at least one product. The server already drops empty ones — 11 of the
   * 15 rows in `qv.product_group` have no products and never appear here.
   */
  async fetchProductGroups(near?: {
    latitude: number;
    longitude: number;
  }): Promise<GroceryGroup[]> {
    // With a location, only products from kiranas that deliver there come back.
    const response = await apiCall(
      axiosInstance.get<GroceryGroup[]>('/v3/grocery/product-groups', {
        headers: { Authorization: getAuthHeader() },
        params: near ? { latitude: near.latitude, longitude: near.longitude } : undefined,
      })
    );
    return Array.isArray(response) ? response : [];
  }
}

export default new GroceryGroupsService();
