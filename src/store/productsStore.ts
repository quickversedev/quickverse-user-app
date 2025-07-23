import { create } from 'zustand';
import { mockProducts, Product } from '../assets/mock/products';
import axiosInstance from '../config/api/axios.config';

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
  fetchProducts: (opts?: { offset?: number; limit?: number; append?: boolean }) => Promise<void>;
  resetProducts: () => void;
  setShopId: (shopId: string) => void;
  // Selector: Get products by category from the current store
  getProductsByCategory: (categoryId: string) => Product[];
  // Selector: Get best seller products (tagName === 'BestSeller')
  getBestSellers: () => Product[];
}

// Toggle this flag to switch between mock and real API
const USE_PRODUCTS_MOCKS = true; // Set to true for mock data

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

  fetchProducts: async ({ offset, limit, append } = {}) => {
    set({ loading: true, fullyLoaded: false, error: null });
    if (USE_PRODUCTS_MOCKS) {
      // Simulate network delay
      await new Promise(res => setTimeout(res, 500));
      const currentOffset = offset !== undefined ? offset : get().offset;
      const currentLimit = limit !== undefined ? limit : get().limit;
      const pagedProducts = mockProducts.slice(currentOffset, currentOffset + currentLimit);
      const total = mockProducts.length;
      set(state => ({
        products: append ? [...state.products, ...pagedProducts] : pagedProducts,
        offset: currentOffset + pagedProducts.length,
        total,
        hasMore: currentOffset + pagedProducts.length < total,
        loading: false,
        fullyLoaded: currentOffset + pagedProducts.length >= total,
        error: null,
      }));
      return;
    }
    try {
      const currentLimit = limit !== undefined ? limit : get().limit;
      let currentOffset = offset !== undefined ? offset : get().offset;
      // Ensure offset is always a multiple of limit
      currentOffset = Math.floor(currentOffset / currentLimit) * currentLimit;
      const shopId = get().shopId;
      let allProducts: Product[] = append ? [...get().products] : [];
      let hasMore = true;
      let total = 0;
      let firstBatchLoaded = false;
      while (hasMore) {
        const response = await axiosInstance.post(`/v3/products?shopId=${shopId}`, {
          filters: {},
          offset: String(currentOffset),
          limit: String(currentLimit),
        });
        if (!response || typeof response !== 'object' || !('data' in response)) {
          set({ loading: false, fullyLoaded: false, error: 'Invalid server response.' });
          return;
        }
        const data = response.data;
        if (!data || typeof data !== 'object') {
          set({ loading: false, fullyLoaded: false, error: 'Invalid data format from server.' });
          return;
        }
        const newProducts = data.products || data.data || [];
        total = data.total || data.count || 0;
        allProducts = [...allProducts, ...newProducts];
        currentOffset += newProducts.length;
        // Set loading to false after first batch so UI can show products
        if (!firstBatchLoaded) {
          set({
            products: allProducts,
            offset: allProducts.length,
            total,
            hasMore: true,
            loading: false,
            fullyLoaded: false,
            error: null,
          });
          firstBatchLoaded = true;
        }
        // If less than limit, we've reached the last page
        if (newProducts.length < currentLimit) {
          hasMore = false;
        }
      }
      set({
        products: allProducts,
        offset: allProducts.length,
        total,
        hasMore: allProducts.length < total,
        loading: false,
        fullyLoaded: true,
        error: null,
      });
    } catch (error: unknown) {
      console.error('error', error);
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
  getProductsByCategory: (categoryId: string) => {
    return get().products.filter(product => product.category === categoryId);
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
