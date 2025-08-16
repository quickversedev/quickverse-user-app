import { Product } from '../assets/mock/products';
import axiosInstance, { apiCall } from '../config/api/axios.config';

// Mock data toggle
const USE_PRODUCTS_MOCKS = true; // Set to false for real API

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
    limit = 10,
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
              p.brand.toLowerCase().includes(searchLower)
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
      const response = await apiCall(
        axiosInstance.post<ProductsApiResponse>(`/v3/products?shopId=${shopId}`, {
          filters,
          offset: String(offset),
          limit: String(limit),
        })
      );

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

        allProducts = [...allProducts, ...response.products];
        total = response.total;
        currentOffset += response.products.length;

        // Check if we've reached the end
        if (response.products.length < limit) {
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
          acc[p.division] = (acc[p.division] || 0) + 1;
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
      const response = await apiCall(
        axiosInstance.get<CategoryApiResponse>(`/v3/${shopId}/category`, {
          headers: {
            Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
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
  console.log(`Products Mock Mode: ${useMocks ? 'ENABLED' : 'DISABLED'}`);
  // eslint-disable-next-line no-console
  console.log('To change this setting, modify USE_PRODUCTS_MOCKS in productsService.ts');
};

export const getProductsMockStatus = () => {
  return USE_PRODUCTS_MOCKS;
};

export default new ProductsService();
