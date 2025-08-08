import { useCallback, useEffect, useRef, useState } from 'react';
import { Product } from '../types/product';
import useFeaturedProductsStoreHook from './useFeaturedProductsStore';

interface UseFeaturedProductsReturn {
  featuredProducts: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
}

interface UseFeaturedProductsParams {
  shopId: string;
  limit?: number;
  autoFetch?: boolean;
}

const useFeaturedProducts = ({
  shopId,
  limit = 5,
  autoFetch = true,
}: UseFeaturedProductsParams): UseFeaturedProductsReturn => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Use refs to track if we've already fetched for this shopId
  const hasFetchedRef = useRef<Set<string>>(new Set());
  const lastShopIdRef = useRef<string>('');

  const {
    getFeaturedProducts,
    getCachedProducts,
    isLoading: storeLoading,
    getError: storeError,
    isExpired,
  } = useFeaturedProductsStoreHook();

  const fetchFeaturedProducts = useCallback(async () => {
    if (!shopId) {
      setError('Shop ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const products = await getFeaturedProducts(shopId, limit);
      // Ensure products is always an array
      const safeProducts = Array.isArray(products) ? products : [];
      setFeaturedProducts(safeProducts);
      setHasMore(safeProducts.length === limit);
      hasFetchedRef.current.add(shopId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setFeaturedProducts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [shopId, limit, getFeaturedProducts]);

  const refetch = useCallback(async () => {
    await fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  // Check for cached data on mount and when shopId changes
  useEffect(() => {
    if (!shopId || shopId === lastShopIdRef.current) return;

    lastShopIdRef.current = shopId;
    hasFetchedRef.current.clear(); // Reset fetch tracking for new shop

    const cachedProducts = getCachedProducts(shopId);
    const isCacheExpired = isExpired(shopId);

    if (cachedProducts && Array.isArray(cachedProducts) && !isCacheExpired) {
      setFeaturedProducts(cachedProducts);
      setHasMore(cachedProducts.length === limit);
      setError(null);
      setLoading(false);
      hasFetchedRef.current.add(shopId);
    } else if (isCacheExpired) {
      // Cache is expired, clear the data
      setFeaturedProducts([]);
      setError(null);
    }
  }, [shopId, limit, getCachedProducts, isExpired]);

  // Auto-fetch if needed (when no cached data or cache is expired)
  useEffect(() => {
    if (!autoFetch || !shopId || hasFetchedRef.current.has(shopId)) return;

    const cachedProducts = getCachedProducts(shopId);
    const isCacheExpired = isExpired(shopId);

    if (!cachedProducts || isCacheExpired) {
      fetchFeaturedProducts();
    }
  }, [autoFetch, shopId, getCachedProducts, isExpired, fetchFeaturedProducts]);

  // Sync with store loading and error states (only when not already loading)
  useEffect(() => {
    if (!shopId) return;

    const storeLoadingState = storeLoading(shopId);
    const storeErrorState = storeError(shopId);

    // Only update if states are different to prevent unnecessary re-renders
    if (storeLoadingState !== loading) {
      setLoading(storeLoadingState);
    }

    if (storeErrorState !== error) {
      setError(storeErrorState);
    }
  }, [shopId, storeLoading, storeError, loading, error]);

  return {
    featuredProducts,
    loading,
    error,
    refetch,
    hasMore,
  };
};

export default useFeaturedProducts;
