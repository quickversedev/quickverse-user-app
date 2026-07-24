import axiosInstance, { apiCall, getAuthHeader } from '../config/api/axios.config';
import { Product } from '../types/product';

export interface CollectionCategoryApi {
  id: string;
  name: string;
  displayOrder: number;
  productCount: number;
}

export interface CollectionApi {
  id: string;
  name: string;
  image: string | null;
  icon: string | null;
  displayOrder: number;
  categories: CollectionCategoryApi[];
  productCount: number;
}

export interface CollectionProductsResponse {
  collectionId: string;
  collectionName: string;
  categories: CollectionCategoryApi[];
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}

class CollectionsService {
  async fetchCollections(shopId: string): Promise<CollectionApi[]> {
    const authHeader = getAuthHeader();
    const response = await apiCall(
      axiosInstance.get<CollectionApi[]>(`/v3/${shopId}/collections`, {
        headers: { Authorization: authHeader },
      })
    );
    return response || [];
  }

  async fetchCollectionProducts(
    shopId: string,
    collectionId: string,
    opts: { limit?: number; offset?: number; search?: string; brand?: string } = {}
  ): Promise<CollectionProductsResponse> {
    const authHeader = getAuthHeader();
    const params: Record<string, string | number> = {};
    if (opts.limit != null) params.limit = opts.limit;
    if (opts.offset != null) params.offset = opts.offset;
    if (opts.search) params.search = opts.search;
    if (opts.brand) params.brand = opts.brand;

    const response = await apiCall(
      axiosInstance.get<CollectionProductsResponse>(
        `/v3/${shopId}/collections/${collectionId}/products`,
        { headers: { Authorization: authHeader }, params }
      )
    );
    return response;
  }

  async fetchCollectionBrands(shopId: string, collectionId: string): Promise<string[]> {
    const authHeader = getAuthHeader();
    const response = await apiCall(
      axiosInstance.get<string[]>(`/v3/${shopId}/collections/${collectionId}/brands`, {
        headers: { Authorization: authHeader },
      })
    );
    return response || [];
  }
}

const collectionsService = new CollectionsService();
export default collectionsService;
