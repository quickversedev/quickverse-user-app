import { create } from 'zustand';
import productsService, { ProductsApiResponse } from '../../services/productsService';
import { Product as MockProduct, Product } from '../../types/product';

interface CachedFeaturedProducts {
  products: Product[];
  timestamp: number;
  loading: boolean;
  error: string | null;
}

interface FeaturedProductsStore {
  // Cache structure: shopId -> CachedFeaturedProducts
  cache: Record<string, CachedFeaturedProducts>;

  // Batch loading state
  batchLoading: boolean;
  batchError: string | null;

  // Cache configuration
  cacheExpiryMs: number; // Default: 5 minutes

  // Actions
  getFeaturedProducts: (shopId: string, limit?: number) => Promise<Product[]>;
  getFeaturedProductsBatch: (
    shopIds: string[],
    limit?: number
  ) => Promise<Record<string, Product[]>>;
  clearCache: (shopId?: string) => void;
  clearExpiredCache: () => void;
  isCached: (shopId: string) => boolean;
  isExpired: (shopId: string) => boolean;

  // Selectors
  getCachedProducts: (shopId: string) => Product[] | null;
  getLoadingState: (shopId: string) => boolean;
  getErrorState: (shopId: string) => string | null;
}

const DEFAULT_CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5mins cashing
const DEFAULT_LIMIT = 5;

const useFeaturedProductsStore = create<FeaturedProductsStore>((set, get) => ({
  cache: {},
  batchLoading: false,
  batchError: null,
  cacheExpiryMs: DEFAULT_CACHE_EXPIRY_MS,

  getFeaturedProducts: async (shopId: string, limit: number = DEFAULT_LIMIT) => {
    const { cache, isExpired } = get();

    // Check if we have valid cached data
    if (cache[shopId] && !isExpired(shopId)) {
      return cache[shopId].products || [];
    }

    // Set loading state for this shop (handle both new and existing cache entries)
    set(state => ({
      cache: {
        ...state.cache,
        [shopId]: {
          products: cache[shopId]?.products || [],
          timestamp: cache[shopId]?.timestamp || Date.now(),
          loading: true,
          error: null,
        },
      },
    }));

    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // Reduced to 10 seconds
      });

      // Use productsService to fetch all products with bestSeller filter
      const fetchPromise = productsService.fetchProducts({
        shopId,
        filters: { tag: 'BestSeller' },
        limit: 1000, // Fetch all best sellers, then limit in store
      });
      const response = (await Promise.race([fetchPromise, timeoutPromise])) as
        | ProductsApiResponse
        | MockProduct[];
      if (response) {
        // Normalize to an array of products whether the API returned an object or array
        const productsSource: MockProduct[] = Array.isArray(response)
          ? (response as MockProduct[])
          : ((response as ProductsApiResponse).products ?? []);

        // Apply limit to the fetched products
        const limitedProducts = productsSource.slice(0, limit);

        // Convert mock Product type to expected Product type
        const convertedProducts: Product[] = limitedProducts.map((mockProduct: MockProduct) => ({
          sku: mockProduct.sku,
          shopId: mockProduct.shopId,
          name: mockProduct.name,
          price: mockProduct.sellingPrice,
          mrp: mockProduct.mrp,
          imageUrl: mockProduct.imageUrl,
          numberOfVariants: mockProduct.numberOfVariants,
          variantAttributes: [], // Mock products don't have variant attributes
          rating: mockProduct.rating, // Random rating between 4.0 and 5.0
          discount: mockProduct.discount,
          quantity: 0,
          category: mockProduct.category,
          sellingPrice: mockProduct.sellingPrice,
          primarySKU: mockProduct.primarySKU,
          brand: mockProduct.brand,
          inStock: mockProduct.inStock,
          currentStock: mockProduct.currentStock,
          tags: mockProduct.tags,
          veg: mockProduct.veg,
        }));

        const cachedData: CachedFeaturedProducts = {
          products: convertedProducts,
          timestamp: Date.now(),
          loading: false,
          error: null,
        };

        set(state => ({
          cache: {
            ...state.cache,
            [shopId]: cachedData,
          },
        }));

        return cachedData.products;
      } else {
        const errorData: CachedFeaturedProducts = {
          products: [],
          timestamp: Date.now(),
          loading: false,
          error: 'Failed to fetch featured products',
        };

        set(state => ({
          cache: {
            ...state.cache,
            [shopId]: errorData,
          },
        }));

        throw new Error(errorData.error || 'Failed to fetch featured products');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

      const errorData: CachedFeaturedProducts = {
        products: [],
        timestamp: Date.now(),
        loading: false,
        error: errorMessage,
      };

      set(state => ({
        cache: {
          ...state.cache,
          [shopId]: errorData,
        },
      }));

      throw error;
    }
  },

  getFeaturedProductsBatch: async (shopIds: string[], limit: number = DEFAULT_LIMIT) => {
    set({ batchLoading: true, batchError: null });

    try {
      // Filter out already cached and non-expired shopIds
      const { cache, isExpired } = get();
      const uncachedShopIds = shopIds.filter(shopId => !cache[shopId] || isExpired(shopId));

      if (uncachedShopIds.length === 0) {
        // All shops are cached, return cached data
        const batchResults: Record<string, Product[]> = {};
        shopIds.forEach(shopId => {
          const cached = get().getCachedProducts(shopId);
          if (cached) {
            batchResults[shopId] = cached;
          }
        });
        set({ batchLoading: false });
        return batchResults;
      }

      // Fetch products for uncached shops in parallel
      const fetchPromises = uncachedShopIds.map(async shopId => {
        try {
          return await get().getFeaturedProducts(shopId, limit);
        } catch (error) {
          // Return empty array for failed shops instead of throwing
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);

      // Process results and update cache
      const batchResults: Record<string, Product[]> = {};

      results.forEach((products, index) => {
        const shopId = uncachedShopIds[index];
        batchResults[shopId] = Array.isArray(products) ? products : [];
      });

      // Add cached results
      shopIds.forEach(shopId => {
        if (!uncachedShopIds.includes(shopId)) {
          const cached = get().getCachedProducts(shopId);
          if (cached) {
            batchResults[shopId] = cached;
          }
        }
      });

      set({ batchLoading: false });
      return batchResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch fetch failed';
      set({ batchLoading: false, batchError: errorMessage });
      throw error;
    }
  },

  clearCache: (shopId?: string) => {
    if (shopId) {
      set(state => {
        const newCache = { ...state.cache };
        delete newCache[shopId];
        return { cache: newCache };
      });
    } else {
      set({ cache: {} });
    }
  },

  clearExpiredCache: () => {
    const { cache, isExpired } = get();
    const expiredShopIds = Object.keys(cache).filter(shopId => {
      const cached = cache[shopId];
      // Don't clear if currently loading
      return isExpired(shopId) && !cached.loading;
    });

    if (expiredShopIds.length > 0) {
      set(state => {
        const newCache = { ...state.cache };
        expiredShopIds.forEach(shopId => {
          delete newCache[shopId];
        });
        return { cache: newCache };
      });
    }
  },

  isCached: (shopId: string) => {
    const { cache } = get();
    return !!cache[shopId];
  },

  isExpired: (shopId: string) => {
    const { cache, cacheExpiryMs } = get();
    const cached = cache[shopId];
    if (!cached) return true;

    const now = Date.now();
    return now - cached.timestamp > cacheExpiryMs;
  },

  getCachedProducts: (shopId: string) => {
    const { cache, isExpired } = get();
    const cached = cache[shopId];
    if (!cached || isExpired(shopId)) return null;
    return cached.products;
  },

  getLoadingState: (shopId: string) => {
    const { cache } = get();
    return cache[shopId]?.loading || false;
  },

  getErrorState: (shopId: string) => {
    const { cache } = get();
    return cache[shopId]?.error || null;
  },
}));

export default useFeaturedProductsStore;
