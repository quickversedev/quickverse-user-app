import { create } from 'zustand';
import productsService, { Category } from '../../services/productsService';
import { storage } from '../../services/localStorage/storage.service';
import { Product } from '../../types/product';

const CACHE_TTL = 5 * 60 * 1000;
const PRODUCTS_PREFIX = 'ps-products-';
const CATEGORIES_PREFIX = 'ps-categories-';

interface CacheEntry<T> {
  data: T;
  ts: number;
}

function readCache<T>(key: string): T | null {
  try {
    const raw = storage.getString(key);
    if (raw) {
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.ts < CACHE_TTL) return entry.data;
    }
  } catch {}
  return null;
}

function writeCache<T>(key: string, data: T) {
  try {
    storage.set(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

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

  fetchCollectionProducts: (shopId: string, categoryIds: string[]) => Promise<void>;
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
    const shopId = get().shopId;
    let hasCachedData = false;

    if (!append) {
      const cached = readCache<Product[]>(PRODUCTS_PREFIX + shopId);
      if (cached) {
        set({ products: cached, loading: false, fullyLoaded: true, total: cached.length, error: null });
        hasCachedData = true;
      }
    }

    if (!hasCachedData) {
      set({ loading: true, fullyLoaded: false, error: null });
    }

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

      if (!append) {
        writeCache(PRODUCTS_PREFIX + shopId, finalProducts);
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

      if (!hasCachedData) {
        set({ loading: false, fullyLoaded: false, error: message });
      }
    }
  },

  // Fetch categories for a given shop. In the real API, the category "id" maps to the product "division" field
  fetchCategories: async (shopIdOverride?: string) => {
    const shopId = shopIdOverride || get().shopId;
    let hasCachedData = false;

    const cached = readCache<Category[]>(CATEGORIES_PREFIX + shopId);
    if (cached) {
      set({ categories: cached, categoriesLoading: false, categoriesError: null });
      hasCachedData = true;
    }

    if (!hasCachedData) {
      set({ categoriesLoading: true, categoriesError: null });
    }

    try {
      const categories = await productsService.fetchCategories(shopId);
      writeCache(CATEGORIES_PREFIX + shopId, categories);
      set({ categories, categoriesLoading: false, categoriesError: null });
    } catch (error: unknown) {
      console.error('Fetch categories error:', error);
      if (!hasCachedData) {
        set({ categoriesLoading: false, categoriesError: 'Failed to fetch categories' });
      }
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

  fetchCollectionProducts: async (shopId: string, categoryIds: string[]) => {
    const cacheKey = PRODUCTS_PREFIX + 'col-' + shopId;
    let hasCachedData = false;

    const cached = readCache<Product[]>(cacheKey);
    if (cached) {
      set({ products: cached, loading: false, fullyLoaded: true, total: cached.length, error: null });
      hasCachedData = true;
    }

    if (!hasCachedData) {
      set({ loading: true, fullyLoaded: false, error: null, products: [] });
    }

    try {
      const productPromises = categoryIds.map(categoryId =>
        productsService.fetchProductsForCollection({ shopId, categoryId })
      );

      const results = await Promise.all(productPromises);
      // results is an array of arrays of products
      const allProducts = results.flat();

      // Normalize product image: SmartPOS/collection API may use image, primaryImage, imageURL, etc.
      const normalizeImageUrl = (p: Product & Record<string, unknown>): string => {
        if (typeof p.imageUrl === 'string' && p.imageUrl) return p.imageUrl;
        if (typeof p.image === 'string' && p.image) return p.image;
        if (typeof (p as { primaryImage?: string }).primaryImage === 'string')
          return (p as { primaryImage: string }).primaryImage;
        const urls = (p as { imageURL?: string | string[] }).imageURL;
        if (Array.isArray(urls) && urls[0]) return urls[0];
        if (typeof urls === 'string') return urls;
        return '';
      };

      // Filter unique products and normalize imageUrl
      const seenSkus = new Set<string>();
      const uniqueProducts = allProducts
        .filter(product => {
          if (product.sku && !seenSkus.has(product.sku)) {
            seenSkus.add(product.sku);
            return true;
          }
          return false;
        })
        .map(product => ({
          ...product,
          imageUrl:
            product.imageUrl || normalizeImageUrl(product as Product & Record<string, unknown>),
        }));

      writeCache(cacheKey, uniqueProducts);

      set({
        products: uniqueProducts,
        loading: false,
        fullyLoaded: true,
        total: uniqueProducts.length,
        shopId,
      });
    } catch (error) {
      console.error('[ProductsStore] Error fetching collection products:', error);
      if (!hasCachedData) {
        set({ loading: false, error: 'Failed to fetch collection products' });
      }
    }
  },
}));
