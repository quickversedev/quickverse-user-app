import { create } from 'zustand';
import productsService, { Category } from '../../services/productsService';
import { Product } from '../../types/product';

interface ProductsStore {
  products: Product[];
  loading: boolean; // true while fetching any data (including first batch)
  fullyLoaded: boolean; // true only when all pages are fetched
  error: string | null;
  offset: number;
  limit: number;
  total: number;
  shopId: string;
  hasMore: boolean;

  // Categories
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  fetchCategories: (shopIdOverride?: string) => Promise<void>;
  fetchProducts: (opts?: { offset?: number; limit?: number; append?: boolean }) => Promise<void>;
  resetProducts: () => void;
  setShopId: (shopId: string) => void;
  // Selector: Get products by category from the current store
  getProductsByCategory: (categoryId: string) => Product[];
  // Selector: Get products by multiple categories (comma-separated string)
  getProductsByCategories: (categoriesString: string) => Product[];
  // Selector: Get best seller products (tagName === 'BestSeller')
  getBestSellers: () => Product[];
}

export const useProductsStore = create<ProductsStore>((set, get) => ({
  products: [],
  loading: false,
  fullyLoaded: false,
  error: null,
  offset: 0,
  limit: 10,
  total: 0,
  shopId: '',
  hasMore: true,

  // Categories initial state
  categories: [],
  categoriesLoading: false,
  categoriesError: null,

  fetchProducts: async ({ offset, limit, append } = {}) => {
    set({ loading: true, fullyLoaded: false, error: null });

    try {
      const currentOffset = offset !== undefined ? offset : get().offset;
      const currentLimit = limit !== undefined ? limit : get().limit;
      const shopId = get().shopId;

      // Use the products service to fetch products
      const response = await productsService.fetchAllProducts({
        shopId,

        limit: currentLimit,
      });
      // Add null checks and fallbacks to prevent "length of undefined" errors
      // Handle case where response is directly an array of products
      const newProducts = Array.isArray(response) ? response : response?.products || [];
      const total = response?.total || newProducts.length;

      // Filter products to keep only unique ones based on SKU
      const filterUniqueProducts = (products: Product[]) => {
        const seenSkus = new Set<string>();
        return products.filter(product => {
          if (product.sku && !seenSkus.has(product.sku)) {
            seenSkus.add(product.sku);
            return true;
          }
          return false;
        });
      };

      // Apply unique filtering to new products and existing products when appending
      let finalProducts: Product[];
      if (append) {
        const existingProducts = get().products;
        const combinedProducts = [...existingProducts, ...newProducts];
        finalProducts = filterUniqueProducts(combinedProducts);

      } else {
        finalProducts = filterUniqueProducts(newProducts);

      }

      set(state => ({
        products: finalProducts,
        offset: currentOffset + finalProducts.length,
        total,
        hasMore: currentOffset + finalProducts.length < total,
        loading: false,
        fullyLoaded: currentOffset + finalProducts.length >= total,
        error: null,
      }));
    } catch (error: unknown) {
      console.error('Fetch products error:', error);
      let message = 'Failed to fetch products.';

      if (typeof error === 'object' && error !== null) {
        // Axios error with response
        if ('response' in error && error.response && typeof error.response === 'object') {
          const response = error.response as {
            status?: number;
            statusText?: string;
            data?: { message?: string; error?: string };
          };
          const status = response.status;
          const statusText = response.statusText || '';
          const serverMsg = response.data?.message || response.data?.error || '';
          message = `Server error (${status}): ${statusText} ${serverMsg}`.trim();
        } else if ('message' in error) {
          message = (error as { message?: string }).message || message;
        }
      }

      set({ loading: false, fullyLoaded: false, error: message });
    }
  },

  // Fetch categories for a given shop. In the real API, the category "id" maps to the product "division" field
  fetchCategories: async (shopIdOverride?: string) => {
    const shopId = shopIdOverride || get().shopId;
    set({ categoriesLoading: true, categoriesError: null });

    try {
      // Use the products service to fetch categories
      const categories = await productsService.fetchCategories(shopId);
      set({ categories, categoriesLoading: false, categoriesError: null });
    } catch (error: unknown) {
      console.error('Fetch categories error:', error);
      set({ categoriesLoading: false, categoriesError: 'Failed to fetch categories' });
    }
  },

  resetProducts: () =>
    set({
      products: [],
      offset: 0,
      total: 0,
      hasMore: true,
      loading: false,
      fullyLoaded: false,
      error: null,
    }),

  setShopId: (shopId: string) => set({ shopId }),

  // Selector: Get products by category from the current store
  // NOTE: API's category.id maps to product.division; so categoryId should be compared with product.division
  getProductsByCategory: (categoryId: string) => {
    const products = get().products || [];
    return products.filter(product => product?.division === categoryId);
  },

  // Selector: Get products by multiple categories (comma-separated string)
  getProductsByCategories: (categoriesString: string) => {
    const products = get().products || [];
    if (!categoriesString || categoriesString.trim() === '') {
      return [];
    }

    const categories = categoriesString.split(',').map(cat => cat.trim());
    return products.filter(product => product?.division && categories.includes(product.division));
  },

  // Selector: Get best seller products (tagName === 'BestSeller')
  getBestSellers: () => {
    const products = get().products || [];
    return products.filter(product => {
      if (product?.tags && Array.isArray(product.tags)) {
        return product.tags.some((tag: { tagName: string }) => tag.tagName === 'BestSeller');
      }
      return false;
    });
  },
}));
