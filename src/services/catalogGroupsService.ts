import axiosInstance, { apiCall, getAuthHeader } from '../config/api/axios.config';
import { GroceryGroup } from './groceryGroupsService';

/**
 * The Daily Essentials catalogue: groups ("Snacks & Beverages") above subgroups ("Chips &
 * Namkeen") above products. Admin arranges the first two levels in the web panel.
 *
 * Subgroups are the `qv.product_group` rows `groceryGroupsService` has always read; a group is
 * the new level above them. The tree comes without products — a tile only needs its count and
 * lowest price — and a subgroup's products are fetched when its tile is opened.
 */

/** A tile: a subgroup with its count and lowest price, without its products. */
export interface CatalogSubgroup extends Omit<GroceryGroup, 'products'> {
  /** The chip on the image, e.g. "Craving". */
  badgeLabel: string | null;
  /** The green line under the name; null means show "From ₹<lowest price>". */
  offerText: string | null;
}

export interface CatalogGroup {
  groupId: string;
  name: string;
  /** The pill on the right of the header, e.g. "MUNCHIES". */
  badgeText: string | null;
  /** The header's left bar, #RRGGBB. */
  accentColor: string | null;
  subgroups: CatalogSubgroup[];
}

export interface Near {
  latitude: number;
  longitude: number;
}

class CatalogGroupsService {
  /**
   * Groups in admin order, each with the subgroups that have something to sell near this point.
   * Groups left with none, subgroups not yet placed in a group and inactive ones never come back.
   */
  async fetchCatalog(near?: Near, regionId?: string | null): Promise<CatalogGroup[]> {
    const response = await apiCall(
      axiosInstance.get<CatalogGroup[]>('/v3/grocery/catalog-groups', {
        headers: { Authorization: getAuthHeader() },
        params: {
          ...(near ? { latitude: near.latitude, longitude: near.longitude } : {}),
          ...(regionId ? { regionId } : {}),
        },
      })
    );
    return Array.isArray(response) ? response : [];
  }

  /** One subgroup with its products near this point, cheapest first. */
  async fetchSubgroup(subgroupId: string, near?: Near): Promise<GroceryGroup> {
    return apiCall(
      axiosInstance.get<GroceryGroup>(
        `/v3/grocery/product-groups/${encodeURIComponent(subgroupId)}/products`,
        {
          headers: { Authorization: getAuthHeader() },
          params: near ? { latitude: near.latitude, longitude: near.longitude } : undefined,
        }
      )
    );
  }
}

export default new CatalogGroupsService();
