import { create } from 'zustand';
import { Product } from '../../assets/mock/products';
import productsService, { Category } from '../../services/productsService';

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
  shopId: '4512',
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
      const response = await productsService.fetchProducts({
        shopId,
        offset: currentOffset,
        limit: currentLimit,
      });

      const newProducts = response.products;
      const total = response.total;

      set(state => ({
        products: append ? [...state.products, ...newProducts] : newProducts,
        offset: currentOffset + newProducts.length,
        total,
        hasMore: currentOffset + newProducts.length < total,
        loading: false,
        fullyLoaded: currentOffset + newProducts.length >= total,
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
    return get().products.filter(product => product.division === categoryId);
  },

  // Selector: Get best seller products (tagName === 'BestSeller')
  getBestSellers: () => {
    return get().products.filter(product => {
      if (Array.isArray(product.tags)) {
        return product.tags.some((tag: { tagName: string }) => tag.tagName === 'BestSeller');
      }
      return false;
    });
  },
}));
