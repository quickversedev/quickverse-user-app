import { useCallback, useEffect, useState } from 'react';
import productService from '../services/productService';
import { Product } from '../types/product';

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

  const fetchFeaturedProducts = useCallback(async () => {
    if (!shopId) {
      setError('Shop ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await productService.getFeaturedProducts(shopId, limit);

      if (response.success) {
        setFeaturedProducts(response.data || []);
        setHasMore((response.data || []).length === limit);
      } else {
        setError(response.message || 'Failed to fetch featured products');
        setFeaturedProducts([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setFeaturedProducts([]);
      console.error('Error fetching featured products:', err);
    } finally {
      setLoading(false);
    }
  }, [shopId, limit]);

  const refetch = useCallback(async () => {
    await fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  useEffect(() => {
    if (autoFetch && shopId) {
      fetchFeaturedProducts();
    }
  }, [fetchFeaturedProducts, autoFetch, shopId]);

  return {
    featuredProducts,
    loading,
    error,
    refetch,
    hasMore,
  };
};

export default useFeaturedProducts;
