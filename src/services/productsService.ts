import axios from 'axios'; // Import axios directly
import axiosInstance, { apiCall, getAuthHeader } from '../config/api/axios.config';
import { Product } from '../types/product';

// Mock data toggle
const USE_PRODUCTS_MOCKS = false; // Set to false for real API

// Mock products data (imported from existing mock)
import { mockProducts } from '../assets/mock/products';

// Helper function to simulate API delay
const simulateApiDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// API Response Types
export interface ProductsApiResponse {
  products: Product[];
  total: number;
  count: number;
  offset: number;
  limit: number;
}

export interface CategoryApiResponse {
  categories: Category[];
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

export interface ProductsFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  bestSeller?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface FetchProductsParams {
  shopId: string;
  filters?: ProductsFilters;
  offset?: number;
  limit?: number;
}

class ProductsService {
  /**
   * Fetch products for a specific shop with pagination and filters
   */
  async fetchProducts({
    shopId,
    filters = {},
    offset = 0,
    limit = 1000,
  }: FetchProductsParams): Promise<ProductsApiResponse> {
    try {
      if (USE_PRODUCTS_MOCKS) {
        // Simulate API delay for realistic experience
        await simulateApiDelay();

        // Filter mock products by shopId
        const shopProducts = mockProducts.filter(p => p.shopId === shopId);

        // Apply filters (basic implementation)
        let filteredProducts = shopProducts;

        if (filters.category) {
          filteredProducts = filteredProducts.filter(p => p.division === filters.category);
        }

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredProducts = filteredProducts.filter(
            p =>
              p.name.toLowerCase().includes(searchLower) ||
              p.brand?.toLowerCase().includes(searchLower)
          );
        }

        if (filters.minPrice !== undefined) {
          filteredProducts = filteredProducts.filter(p => p.sellingPrice >= filters.minPrice!);
        }

        if (filters.maxPrice !== undefined) {
          filteredProducts = filteredProducts.filter(p => p.sellingPrice <= filters.maxPrice!);
        }

        if (filters.inStock !== undefined) {
          filteredProducts = filteredProducts.filter(p => p.inStock === filters.inStock);
        }

        // Apply pagination
        const pagedProducts = filteredProducts.slice(offset, offset + limit);

        return {
          products: pagedProducts,
          total: filteredProducts.length,
          count: pagedProducts.length,
          offset,
          limit,
        };
      }

      // Real API call
      const authHeader = getAuthHeader();

      const response = await apiCall(
        axiosInstance.post<ProductsApiResponse>(
          `/v3/products?shopId=${shopId}`,
          {
            filters,
            offset: String(offset),
            limit: String(limit),
          },
          {
            headers: {
              Authorization: authHeader,
            },
          }
        )
      );

      // Ensure response has the expected structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from API');
      }

      // Ensure products array exists
      if (!Array.isArray(response.products)) {
        response.products = [];
      }

      // Ensure total is a number
      if (typeof response.total !== 'number') {
        response.total = response.products.length;
      }

      return response;
    } catch (error) {
      console.error('Fetch products error:', error);
      throw error;
    }
  }

  /**
   * Fetch all products for a shop (with pagination handling)
   */
  async fetchAllProducts({
    shopId,
    filters = {},
    limit = 10,
  }: Omit<FetchProductsParams, 'offset'>): Promise<ProductsApiResponse> {
    try {
      if (USE_PRODUCTS_MOCKS) {
        // For mock data, just fetch all products at once
        return this.fetchProducts({ shopId, filters, offset: 0, limit: 1000 });
      }

      // Real API: Fetch all products with pagination
      let allProducts: Product[] = [];
      let currentOffset = 0;
      let total = 0;
      let hasMore = true;
      while (hasMore) {
        const response = await this.fetchProducts({
          shopId,
          filters,
          offset: currentOffset,
          limit,
        });
        const batch: Product[] = response as unknown as Product[];
        allProducts = [...allProducts, ...batch];
        total = response.total;
        currentOffset += batch.length;

        // Check if we've reached the end
        if (batch.length < limit) {
          hasMore = false;
        }
      }

      return {
        products: allProducts,
        total,
        count: allProducts.length,
        offset: 0,
        limit: allProducts.length,
      };
    } catch (error) {
      console.error('Fetch all products error:', error);
      throw error;
    }
  }

  /**
   * Fetch categories for a specific shop
   */
  async fetchCategories(shopId: string): Promise<Category[]> {
    try {
      if (USE_PRODUCTS_MOCKS) {
        // Simulate API delay
        await simulateApiDelay();

        // Build categories from mock products using unique divisions
        const shopProducts = mockProducts.filter(p => p.shopId === shopId);
        const divisionCount = shopProducts.reduce<Record<string, number>>((acc, p) => {
          const div = p.division || 'missing';
          acc[div] = (acc[div] || 0) + 1;
          return acc;
        }, {});

        const categories: Category[] = Object.keys(divisionCount).map(div => ({
          id: div, // maps to product.division
          name: div,
          description: null,
          imageURLs: null,
          type: 'CUSTOM',
          parentCategory: null,
          countOfSkus: divisionCount[div],
        }));

        return categories;
      }

      // Real API call
      const authHeader = getAuthHeader();

      const response = await apiCall(
        axiosInstance.get<CategoryApiResponse>(`/v3/${shopId}/category`, {
          headers: {
            Authorization: authHeader,
          },
        })
      );

      const categories = (response.categories || []).map(c => ({
        ...c,
        // Ensure optional fields are present
        description: c.description ?? null,
        imageURLs: c.imageURLs ?? null,
        parentCategory: c.parentCategory ?? null,
        countOfSkus: c.countOfSkus ?? 0,
      }));

      return categories;
    } catch (error) {
      console.error('Fetch categories error:', error);
      throw error;
    }
  }

  /**
   * Search products by name or brand
   */
  async searchProducts({
    shopId,
    searchTerm,
    limit = 20,
  }: {
    shopId: string;
    searchTerm: string;
    limit?: number;
  }): Promise<ProductsApiResponse> {
    return this.fetchProducts({
      shopId,
      filters: { search: searchTerm },
      offset: 0,
      limit,
    });
  }

  /**
   * Get products by category
   */
  async getProductsByCategory({
    shopId,
    categoryId,
    limit = 50,
  }: {
    shopId: string;
    categoryId: string;
    limit?: number;
  }): Promise<ProductsApiResponse> {
    return this.fetchProducts({
      shopId,
      filters: { category: categoryId },
      offset: 0,
      limit,
    });
  }

  /**
   * Fetch products for a collection (using external API)
   */
  async fetchProductsForCollection({
    shopId,
    categoryId,
  }: {
    shopId: string;
    categoryId: string;
  }): Promise<Product[]> {
    try {
      const url = 'https://smartpos.amazon.in/api-unauthenticated/resources/external/catalog/products?groupVariants=true';
      const payload = {
        shopId: Number(shopId) || shopId, // Try sending as number if possible, or fallback
        filter: {
          isInStock: true,
          division: categoryId
        },
        sortingOption: {
          alphabetical: "ASCENDING"
        },
        offset: 0,
        limit: 50
      };

      console.log(`[ProductsService] Fetching collection products for shop ${shopId} (type: ${typeof payload.shopId}), category ${categoryId}`);
      console.log(`[ProductsService] URL: ${url}`);
      console.log(`[ProductsService] Payload:`, JSON.stringify(payload));

      const response = await axios.post(
        url,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Host': 'smartpos.amazon.in',
            'User-Agent': 'Mozilla/5.0'
          }
        }
      );

      console.log(`[ProductsService] Response status: ${response.status}`);

      let rawProducts: unknown[] = [];
      if (Array.isArray(response.data)) {
        rawProducts = response.data;
      } else if (response.data && typeof response.data === 'object' && Array.isArray((response.data as { products?: unknown[] }).products)) {
        rawProducts = (response.data as { products: unknown[] }).products;
      }

      if (rawProducts.length === 0) {
        console.log(`[ProductsService] No products found in response for category ${categoryId}`);
        return [];
      }

      console.log(`[ProductsService] Found ${rawProducts.length} products for category ${categoryId}`);

      // Normalize each product to our Product shape; SmartPOS may use different image field names
      const pickImageUrl = (p: Record<string, unknown>): string => {
        const keys = [
          'imageUrl', 'imageURL', 'image', 'primaryImage', 'primaryImageUrl',
          'thumbnailUrl', 'thumbnail', 'productImage', 'productImageUrl', 'img', 'photoUrl', 'picture',
        ];
        for (const k of keys) {
          const v = p[k];
          if (typeof v === 'string' && v.trim()) return v;
          if (Array.isArray(v) && v[0] && typeof v[0] === 'string') return v[0];
        }
        const images = p.images ?? p.imageUrls ?? p.media ?? p.photos;
        if (Array.isArray(images) && images.length > 0) {
          const first = images[0];
          if (typeof first === 'string') return first;
          if (first && typeof first === 'object') {
            const obj = first as Record<string, unknown>;
            if (typeof obj.url === 'string') return obj.url;
            if (typeof obj.imageUrl === 'string') return obj.imageUrl;
            if (typeof obj.src === 'string') return obj.src;
          }
        }
        // Nested: details.image, attributes.image, etc.
        const details = p.details ?? p.attributes ?? p.info;
        if (details && typeof details === 'object') {
          const d = details as Record<string, unknown>;
          if (typeof d.image === 'string') return d.image;
          if (typeof d.imageUrl === 'string') return d.imageUrl;
        }
        return '';
      };

      const products: Product[] = rawProducts.map((raw: unknown) => {
        const p = (raw && typeof raw === 'object' ? raw : {}) as Product & Record<string, unknown>;
        const imageUrl = p.imageUrl || pickImageUrl(p as Record<string, unknown>);
        // SmartPOS may use different keys for stock; default to true so collection products aren't greyed out
        const inStock = p.inStock ?? (p as Record<string, unknown>).available ?? (p as Record<string, unknown>).in_stock ?? true;
        // SmartPOS may omit 'veg' indicator for groceries, so default to true unless explicitly false
        const isVeg = p.veg ?? (p as Record<string, unknown>).isVeg ?? (p as Record<string, unknown>).is_veg ?? true;

        if (!imageUrl && rawProducts[0] === raw && __DEV__) {
          console.log('[ProductsService] Collection product sample keys:', Object.keys(p));
        }
        return {
          ...p,
          imageUrl: typeof imageUrl === 'string' ? imageUrl : '',
          inStock: Boolean(inStock),
          veg: Boolean(isVeg)
        } as Product;
      });

      return products;
    } catch (error) {
      console.error(`[ProductsService] Error fetching collection products for category ${categoryId}:`, error);
      return [];
    }
  }

  /**
   * Get best seller products
   */
  async getBestSellers({
    shopId,
    limit = 20,
  }: {
    shopId: string;
    limit?: number;
  }): Promise<ProductsApiResponse> {
    try {
      if (USE_PRODUCTS_MOCKS) {
        // Simulate API delay
        await simulateApiDelay();

        // Filter mock products by shopId and best seller tag
        const shopProducts = mockProducts.filter(p => p.shopId === shopId);
        const bestSellers = shopProducts.filter(product => {
          if (Array.isArray(product.tags)) {
            return product.tags.some((tag: { tagName: string }) => tag.tagName === 'BestSeller');
          }
          return false;
        });

        return {
          products: bestSellers.slice(0, limit),
          total: bestSellers.length,
          count: Math.min(bestSellers.length, limit),
          offset: 0,
          limit,
        };
      }

      // Real API call for best sellers
      return this.fetchProducts({
        shopId,
        filters: { bestSeller: true },
        offset: 0,
        limit,
      });
    } catch (error) {
      console.error('Get best sellers error:', error);
      throw error;
    }
  }
}

// Export helper functions for mock control
export const setUseProductsMocks = (useMocks: boolean) => {
  // eslint-disable-next-line no-console
  //console.log(`Products Mock Mode: ${useMocks ? 'ENABLED' : 'DISABLED'}`);
  // eslint-disable-next-line no-console
  //console.log('To change this setting, modify USE_PRODUCTS_MOCKS in productsService.ts');
};

export const getProductsMockStatus = () => {
  return USE_PRODUCTS_MOCKS;
};

export default new ProductsService();
