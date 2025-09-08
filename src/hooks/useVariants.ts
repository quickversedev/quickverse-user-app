import { useCallback, useState } from 'react';
import productDetailsService, { ProductVariant } from '../services/productDetailsService';

export interface UseVariantsState {
  variants: ProductVariant[];
  loading: boolean;
  error: string | null;
  hasData: boolean;
}

export interface UseVariantsReturn extends UseVariantsState {
  fetchVariants: (parentSku: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useVariants = (): UseVariantsReturn => {
  const [state, setState] = useState<UseVariantsState>({
    variants: [],
    loading: false,
    error: null,
    hasData: false,
  });

  const fetchVariants = useCallback(async (parentSku: string) => {
    if (!parentSku) {
      setState(prev => ({
        ...prev,
        error: 'Invalid product SKU',
        loading: false,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const response = await productDetailsService.getProductVariants(parentSku);

      if (response.success) {
        setState({
          variants: response.data,
          loading: false,
          error: null,
          hasData: response.data.length > 0,
        });
      } else {
        setState({
          variants: [],
          loading: false,
          error: response.message || 'Failed to fetch variants',
          hasData: false,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState({
        variants: [],
        loading: false,
        error: errorMessage,
        hasData: false,
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      variants: [],
      loading: false,
      error: null,
      hasData: false,
    });
  }, []);

  return {
    ...state,
    fetchVariants,
    clearError,
    reset,
  };
};
