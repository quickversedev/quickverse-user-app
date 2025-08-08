import { useCallback, useEffect } from 'react';
import useFeaturedProductsStore from '../store/featuredProductsStore';
import { Product } from '../types/product';

interface UseFeaturedProductsStoreHookReturn {
  // Single shop methods
  getFeaturedProducts: (shopId: string, limit?: number) => Promise<Product[]>;
  getCachedProducts: (shopId: string) => Product[] | null;
  isLoading: (shopId: string) => boolean;
  getError: (shopId: string) => string | null;

  // Batch methods
  getFeaturedProductsBatch: (
    shopIds: string[],
    limit?: number
  ) => Promise<Record<string, Product[]>>;
  batchLoading: boolean;
  batchError: string | null;

  // Cache management
  clearCache: (shopId?: string) => void;
  clearExpiredCache: () => void;
  isCached: (shopId: string) => boolean;
  isExpired: (shopId: string) => boolean;

  // Utility methods
  prefetchForVendors: (vendors: Array<{ shopId: string }>) => Promise<void>;

  // Debug method
  debugCache: (shopId?: string) => void;
}

interface UseFeaturedProductsStoreHookParams {
  autoClearExpired?: boolean;
  clearExpiredInterval?: number; // in milliseconds
}

const useFeaturedProductsStoreHook = (
  params: UseFeaturedProductsStoreHookParams = {}
): UseFeaturedProductsStoreHookReturn => {
  const {
    autoClearExpired = true,
    clearExpiredInterval = 5 * 60 * 1000, // 5 minutes
  } = params;

  // Use selectors to get specific parts of the store to prevent unnecessary re-renders
  const getFeaturedProducts = useFeaturedProductsStore(state => state.getFeaturedProducts);
  const getCachedProducts = useFeaturedProductsStore(state => state.getCachedProducts);
  const getLoadingState = useFeaturedProductsStore(state => state.getLoadingState);
  const getErrorState = useFeaturedProductsStore(state => state.getErrorState);
  const getFeaturedProductsBatch = useFeaturedProductsStore(
    state => state.getFeaturedProductsBatch
  );
  const clearCache = useFeaturedProductsStore(state => state.clearCache);
  const clearExpiredCache = useFeaturedProductsStore(state => state.clearExpiredCache);
  const isCached = useFeaturedProductsStore(state => state.isCached);
  const isExpired = useFeaturedProductsStore(state => state.isExpired);
  const batchLoading = useFeaturedProductsStore(state => state.batchLoading);
  const batchError = useFeaturedProductsStore(state => state.batchError);

  // Auto-clear expired cache
  useEffect(() => {
    if (!autoClearExpired) return;

    const interval = setInterval(() => {
      clearExpiredCache();
    }, clearExpiredInterval);

    return () => clearInterval(interval);
  }, [autoClearExpired, clearExpiredInterval, clearExpiredCache]);

  // Memoized methods to prevent unnecessary re-renders
  const isLoading = useCallback((shopId: string) => getLoadingState(shopId), [getLoadingState]);

  const getError = useCallback((shopId: string) => getErrorState(shopId), [getErrorState]);

  // Utility method to prefetch featured products for multiple vendors
  const prefetchForVendors = useCallback(
    async (vendors: Array<{ shopId: string }>) => {
      if (vendors.length === 0) return;

      const shopIds = vendors.map(vendor => vendor.shopId);
      const uncachedShopIds = shopIds.filter(shopId => !isCached(shopId) || isExpired(shopId));

      if (uncachedShopIds.length > 0) {
        try {
          await getFeaturedProductsBatch(uncachedShopIds);
        } catch (error) {
          console.warn('Failed to prefetch featured products:', error);
        }
      }
    },
    [isCached, isExpired, getFeaturedProductsBatch]
  );

  return {
    getFeaturedProducts,
    getCachedProducts,
    isLoading,
    getError,
    getFeaturedProductsBatch,
    batchLoading,
    batchError,
    clearCache,
    clearExpiredCache,
    isCached,
    isExpired,
    prefetchForVendors,
    debugCache: () => {}, // Simplified for now
  };
};

export default useFeaturedProductsStoreHook;
