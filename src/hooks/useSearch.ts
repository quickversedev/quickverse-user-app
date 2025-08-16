import { useCallback, useState } from 'react';
import searchService, { SearchResponse } from '../services/api/searchService';
import useVendorStore from '../store/vendorStore';
import { Vendor } from '../types/vendor';

interface Product {
  id: string;
  name: string;
  image: string;
}

// Toggle for using real API vs mock data
const USE_REAL_SEARCH_API = true; // Set to true to use real API

interface SearchResults {
  vendors: Vendor[];
  products: Product[];
}

interface UseSearchReturn {
  searchQuery: string;
  isLoading: boolean;
  searchResults: SearchResults;
  hasSearched: boolean;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  searchOnSuggestionSelect: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useSearch = (): UseSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    vendors: [],
    products: [],
  });
  const [hasSearched, setHasSearched] = useState(false);

  // Get vendors from vendorStore to filter products
  const { vendors: storeVendors } = useVendorStore();

  // Real API call for search with debouncing
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ vendors: [], products: [] });
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      let searchResponse: SearchResponse;

      if (USE_REAL_SEARCH_API) {
        searchResponse = await searchService.search({
          query: query.trim(),
        });
      } else {
        // Use mock data for development
        searchResponse = await searchService.mockSearch(query.trim());
      }

      // Filter products to only include those from valid vendors in the store
      const validShopIds = new Set(storeVendors.map(vendor => vendor.shopId));

      const filteredProducts: Product[] = searchResponse.products
        .filter(product => validShopIds.has(product.shopId))
        .map(product => ({
          id: product.productSKU,
          name: product.productName,
          image: product.productImage,
        }));

      // Get vendors that have products in the search results
      const vendorsWithProducts = storeVendors.filter(vendor =>
        searchResponse.products.some(product => product.shopId === vendor.shopId)
      );

      setSearchResults({
        vendors: vendorsWithProducts,
        products: filteredProducts,
      });
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to empty results on error
      setSearchResults({ vendors: [], products: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search function for when suggestion is selected
  const searchOnSuggestionSelect = useCallback(
    async (query: string) => {
      if (query.trim()) {
        await performSearch(query);
      }
    },
    [performSearch]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults({ vendors: [], products: [] });
    setHasSearched(false);
  }, []);

  return {
    searchQuery,
    isLoading,
    searchResults,
    hasSearched,
    setSearchQuery,
    performSearch,
    searchOnSuggestionSelect,
    clearSearch,
  };
};
