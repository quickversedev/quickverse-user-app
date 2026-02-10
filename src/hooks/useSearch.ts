import { useCallback, useState } from 'react';
import { API_STORE_ID } from '../data/collectionsData';
import searchService, { SearchResponse } from '../services/api/searchService';
import useVendorStore from '../store/vendorStore';
import { Product } from '../types/product';
import { Vendor } from '../types/vendor';

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

    console.log(`[useSearch] performSearch called with query: "${query}"`);
    console.log(`[useSearch] API_STORE_ID: ${API_STORE_ID}`);

    try {


      let searchResponse: SearchResponse;
      let collectionProducts: import('../services/api/searchService').SearchProduct[] = [];

      if (USE_REAL_SEARCH_API) {
        // Run both searches in parallel
        console.log('[useSearch] Starting parallel searches...');
        const [backendResponse, collectionResults] = await Promise.all([
          searchService.search({ query: query.trim() }),
          API_STORE_ID
            ? searchService.searchCollection(API_STORE_ID, query.trim())
            : Promise.resolve([])
        ]);
        console.log(`[useSearch] Backend results: ${backendResponse.products.length}, Collection results: ${collectionResults.length}`);
        searchResponse = backendResponse;
        collectionProducts = collectionResults;
      } else {
        // Use mock data for development
        searchResponse = await searchService.mockSearch(query.trim());
      }

      // Merge collection products into searchResponse
      if (collectionProducts.length > 0) {
        // Append to backend products (avoid duplicates if backend also returns them)
        const existingSkus = new Set(searchResponse.products.map(p => p.productSKU));
        const newProducts = collectionProducts.filter(p => !existingSkus.has(p.productSKU));
        console.log(`[useSearch] Merging ${newProducts.length} unique collection products`);
        searchResponse.products = [...searchResponse.products, ...newProducts];
      }


      // Filter products to only include those from valid vendors in the store
      const validShopIds = new Set(storeVendors.map(vendor => vendor.shopId));

      // Add API_STORE_ID to valid shop IDs so collection products are not filtered out
      if (API_STORE_ID) {
        validShopIds.add(API_STORE_ID);
        console.log(`[useSearch] Added API_STORE_ID ${API_STORE_ID} to valid shop IDs`);
      }

      console.log(`[useSearch] Valid Shop IDs: ${Array.from(validShopIds).join(', ')}`);

      const filteredProducts: Product[] = searchResponse.products
        .filter(product => {
          const isValid = validShopIds.has(product.shopId);
          if (!isValid) {
            console.log(`[useSearch] Filtering out product ${product.productSKU} from shop ${product.shopId} (not in valid shops)`);
          }
          return isValid;
        })
        .map(product => ({
          sku: product.productSKU,
          name: product.productName,
          imageUrl: product.productImage,
          shopId: product.shopId,
          mrp: product.mrp || 0,
          sellingPrice: product.price || 0,
          rating: 0,
          discount: product.discount || 0,
          veg: product.veg ?? true,
          numberOfVariants: 1,
          primarySKU: product.productSKU,
        }));

      console.log(`[useSearch] Final filtered products count: ${filteredProducts.length}`);

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
  }, [storeVendors]);

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
