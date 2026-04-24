import { useCallback, useRef, useState } from 'react';
import { API_STORE_ID } from '../data/collectionsData';
import searchService, { SearchResponse } from '../services/api/searchService';
import productsService from '../services/productsService';
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

interface UseSearchOptions {
  restrictCategory?: 'Food' | 'Grocery';
}

export const useSearch = (options?: UseSearchOptions): UseSearchReturn => {
  const restrictCategory = options?.restrictCategory;
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    vendors: [],
    products: [],
  });
  const [hasSearched, setHasSearched] = useState(false);

  // Get vendors from vendorStore to filter products
  const { vendors: storeVendors } = useVendorStore();

  // Session cache for federated grocery-vendor product fetches. Keyed by the
  // sorted shopId list so a location change (different vendors nearby)
  // invalidates the cache automatically.
  const federatedCacheRef = useRef<{ key: string; products: Product[] } | null>(null);
  const federatedInflightRef = useRef<Promise<Product[]> | null>(null);

  const ensureFederatedGroceryProducts = useCallback(async (): Promise<Product[]> => {
    const eligible = restrictCategory
      ? storeVendors.filter(v => v.category === restrictCategory)
      : storeVendors;
    const allShopIds = eligible.map(v => v.shopId).filter(Boolean);
    if (allShopIds.length === 0) return [];

    const key = [...allShopIds].sort().join(',');
    if (federatedCacheRef.current?.key === key) {
      console.warn(
        `[useSearch] Federated cache hit (${federatedCacheRef.current.products.length} products across ${allShopIds.length} shops)`
      );
      return federatedCacheRef.current.products;
    }
    if (federatedInflightRef.current) {
      return federatedInflightRef.current;
    }

    console.warn(
      `[useSearch] Federating product fetch across ${allShopIds.length} nearby shops...`
    );
    federatedInflightRef.current = productsService
      .fetchProductsAcrossShops({ shopIds: allShopIds, limitPerShop: 300 })
      .then(prods => {
        console.warn(
          `[useSearch] Federated fetch returned ${prods.length} products across ${allShopIds.length} shops${restrictCategory ? ` (${restrictCategory} only)` : ''}`
        );
        federatedCacheRef.current = { key, products: prods };
        return prods;
      })
      .catch(err => {
        console.warn('[useSearch] Federated fetch failed:', err);
        return [] as Product[];
      })
      .finally(() => {
        federatedInflightRef.current = null;
      });

    return federatedInflightRef.current;
  }, [storeVendors, restrictCategory]);

  // Real API call for search with debouncing
  const performSearch = useCallback(
    async (query: string) => {
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
          // Fan out the SmartBiz collection-style search to every nearby
          // Grocery vendor (e.g. 68246 Daily Essentials, 94728 Shree Samarth)
          // — not just API_STORE_ID. Vendors that aren't SmartBiz-backed will
          // simply return empty.
          const collectionShopIds = new Set<string>();
          if (API_STORE_ID) collectionShopIds.add(API_STORE_ID);
          storeVendors
            .filter(v => v.category === 'Grocery' && v.shopId)
            .forEach(v => collectionShopIds.add(v.shopId));

          console.log(
            `[useSearch] Starting parallel searches across ${collectionShopIds.size} collection shops...`
          );
          const collectionPromises = Array.from(collectionShopIds).map(shopId =>
            searchService.searchCollection(shopId, query.trim()).catch(err => {
              console.warn(`[useSearch] searchCollection failed for shop ${shopId}:`, err);
              return [] as import('../services/api/searchService').SearchProduct[];
            })
          );

          const [backendResponse, collectionResultsArrays, federatedProducts] = await Promise.all([
            searchService.search({ query: query.trim() }),
            Promise.all(collectionPromises),
            ensureFederatedGroceryProducts(),
          ]);
          const mergedCollectionResults = collectionResultsArrays.flat();
          console.log(
            `[useSearch] Backend: ${backendResponse.products.length}, Collection (${collectionShopIds.size} shops): ${mergedCollectionResults.length}, Federated: ${federatedProducts.length}`
          );
          searchResponse = backendResponse;
          collectionProducts = mergedCollectionResults;

          // Filter the federated cache by the current query and merge as
          // SearchProduct entries so dedupe & vendor derivation see them too.
          const q = query.trim().toLowerCase();
          const matched = federatedProducts.filter(p => p.name?.toLowerCase().includes(q));
          console.warn(
            `[useSearch] Federated matches for "${q}": ${matched.length} (from ${federatedProducts.length} cached products)`
          );
          if (matched.length > 0) {
            const existingSkus = new Set(searchResponse.products.map(p => p.productSKU));
            const adapted = matched
              .filter(p => p.sku && !existingSkus.has(p.sku))
              .map(p => ({
                productSKU: p.sku,
                productName: p.name,
                shopId: p.shopId,
                productImage: p.imageUrl || '',
                veg: p.veg,
                price: p.sellingPrice,
                mrp: p.mrp,
                discount: p.discount,
                inStock: p.inStock,
              }));
            searchResponse.products = [...searchResponse.products, ...adapted];
          }
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

        // Filter products to only include those from valid vendors in the
        // store. When the search was launched from a specific category screen
        // (e.g. Grocery), restrict further to vendors of that category so
        // food results don't bleed into a grocery search.
        const eligibleVendors = restrictCategory
          ? storeVendors.filter(v => v.category === restrictCategory)
          : storeVendors;
        const validShopIds = new Set(eligibleVendors.map(vendor => vendor.shopId));

        console.log(`[useSearch] Valid Shop IDs: ${Array.from(validShopIds).join(', ')}`);

        const filteredProducts: Product[] = searchResponse.products
          .filter(product => {
            const isValid = validShopIds.has(product.shopId);
            if (!isValid) {
              console.log(
                `[useSearch] Filtering out product ${product.productSKU} from shop ${product.shopId} (not in valid shops)`
              );
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

        // Get vendors (within the restricted category) that have matching products
        const vendorsWithProducts = eligibleVendors.filter(vendor =>
          searchResponse.products.some(product => product.shopId === vendor.shopId)
        );

        // Round-robin interleave by vendor so the first slots aren't dominated
        // by whichever shop happens to return the most matches. Without this,
        // a shop with many SmartBiz milk hits (e.g. Daily Essentials) crowds
        // out shops with fewer hits (Shree Samarth) below the "Show More" cut.
        const productsByShop = new Map<string, Product[]>();
        for (const p of filteredProducts) {
          if (!p.shopId) continue;
          const list = productsByShop.get(p.shopId) || [];
          list.push(p);
          productsByShop.set(p.shopId, list);
        }
        const shopBuckets = Array.from(productsByShop.values());
        const interleaved: Product[] = [];
        let row = 0;
        let added = true;
        while (added) {
          added = false;
          shopBuckets.forEach(list => {
            if (row < list.length) {
              interleaved.push(list[row]);
              added = true;
            }
          });
          row++;
        }

        console.warn(
          `[useSearch] Interleaved ${interleaved.length} products from ${productsByShop.size} shops`
        );

        setSearchResults({
          vendors: vendorsWithProducts,
          products: interleaved,
        });
      } catch (error) {
        console.error('Search failed:', error);
        // Fallback to empty results on error
        setSearchResults({ vendors: [], products: [] });
      } finally {
        setIsLoading(false);
      }
    },
    [storeVendors, ensureFederatedGroceryProducts, restrictCategory]
  );

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
