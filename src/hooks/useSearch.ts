import { useCallback, useState } from 'react';
import { SEARCH_GRAPHQL_ENABLED } from '../config/api/graphql.config';
import { API_STORE_ID } from '../data/collectionsData';
import searchService, { SearchProduct } from '../services/api/searchService';
import {
  GqlSearchCategoryChip,
  GqlSearchResult,
  mapSuggestionToProduct,
  searchGraphQL,
} from '../services/api/searchGraphQLService';
import useVendorStore from '../store/vendorStore';
import { Product } from '../types/product';
import { Vendor } from '../types/vendor';
import { isStoreOpen } from '../utils/storeUtils';

// Toggle for using real API vs mock data
const USE_REAL_SEARCH_API = true; // Set to true to use real API

/** A vendor plus the search-only extras GraphQL returns alongside it. */
export interface SearchVendorResult {
  vendor: Vendor;
  startingPrice: number | null;
}

interface SearchResults {
  vendors: Vendor[];
  vendorResults: SearchVendorResult[];
  products: Product[];
  categoryChips: GqlSearchCategoryChip[];
  /**
   * Server-side COUNT(*). NOT the length of `products`: the server caps its list at
   * 100 and SmartBiz adds products the count never saw. Treat it as an approximation
   * only — never drive pagination from it.
   */
  totalProductMatches: number;
}

interface UseSearchReturn {
  searchQuery: string;
  isLoading: boolean;
  searchResults: SearchResults;
  hasSearched: boolean;
  categoryFilter: string | null;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string, categoryFilter?: string | null) => Promise<void>;
  searchOnSuggestionSelect: (query: string) => Promise<void>;
  selectCategoryChip: (categoryId: string | null) => Promise<void>;
  clearSearch: () => void;
}

interface UseSearchOptions {
  restrictCategory?: 'Food' | 'Grocery';
}

const EMPTY_RESULTS: SearchResults = {
  vendors: [],
  vendorResults: [],
  products: [],
  categoryChips: [],
  totalProductMatches: 0,
};

/** SmartBiz/REST wire shape → the app's Product. */
const mapSearchProductToProduct = (product: SearchProduct): Product =>
  ({
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
    // Carried through so out-of-stock items can be filtered out below.
    inStock: product.inStock ?? true,
  }) as Product;

export const useSearch = (options?: UseSearchOptions): UseSearchReturn => {
  const restrictCategory = options?.restrictCategory;
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [hasSearched, setHasSearched] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Get vendors from vendorStore to filter products and hydrate search vendors
  const { vendors: storeVendors, getVendorById, searchVendorsByQuery } = useVendorStore();

  const performSearch = useCallback(
    async (query: string, filterOverride?: string | null) => {
      if (!query.trim()) {
        setSearchResults(EMPTY_RESULTS);
        setHasSearched(false);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);

      const trimmed = query.trim();
      const activeFilter = filterOverride !== undefined ? filterOverride : categoryFilter;

      try {
        // The shops this user can actually order from. Sent to the server so it can
        // scope the search in SQL, and reused below as the client-side backstop.
        const eligibleVendors = restrictCategory
          ? storeVendors.filter(v => v.category === restrictCategory)
          : storeVendors;
        const shopIds = eligibleVendors.map(v => v.shopId).filter(Boolean);
        const validShopIds = new Set(shopIds);

        if (!USE_REAL_SEARCH_API) {
          const mock = await searchService.mockSearch(trimmed);
          setSearchResults({
            ...EMPTY_RESULTS,
            products: mock.products.map(mapSearchProductToProduct),
          });
          return;
        }

        /**
         * SmartBiz collection search, fanned out across the collection shops.
         *
         * This CANNOT be replaced by the GraphQL search: shop 68246 (Daily Essentials)
         * is store_active = false, and every GraphQL query requires store_active = true,
         * so its ~1750 products are invisible to the server-side search. This call goes
         * straight to SmartBiz and is the only path that reaches them. It can be removed
         * once that shop is active and its catalogue is in the product table.
         */
        const collectionShopIds = new Set<string>();
        if (restrictCategory !== 'Food') {
          if (API_STORE_ID) collectionShopIds.add(API_STORE_ID);
          storeVendors
            .filter(v => v.category === 'Grocery' && v.shopId)
            .forEach(v => collectionShopIds.add(v.shopId));
        }

        const collectionPromises = Array.from(collectionShopIds).map(shopId =>
          searchService.searchCollection(shopId, trimmed).catch(err => {
            console.warn(`[useSearch] searchCollection failed for shop ${shopId}:`, err);
            return [] as SearchProduct[];
          })
        );

        let gqlResult: GqlSearchResult | null = null;
        let restProducts: SearchProduct[] = [];

        if (SEARCH_GRAPHQL_ENABLED) {
          const [gql, collectionArrays] = await Promise.all([
            searchGraphQL({ keyword: trimmed, categoryFilter: activeFilter, shopIds }),
            Promise.all(collectionPromises),
          ]);
          gqlResult = gql;
          restProducts = collectionArrays.flat();
        } else {
          // Fallback while the GraphQL server branch is undeployed.
          const [backend, collectionArrays] = await Promise.all([
            searchService.search({ query: trimmed }),
            Promise.all(collectionPromises),
          ]);
          restProducts = [...backend.products, ...collectionArrays.flat()];
        }

        // Dedupe on shopId + sku, not sku alone: two vendors legitimately carry the
        // same SKU, and a bare-sku key silently drops one of them.
        const seen = new Set<string>();
        const merged: Product[] = [];
        const push = (product: Product) => {
          if (!product.sku || !product.shopId) return;
          const key = `${product.shopId}:${product.sku}`;
          if (seen.has(key)) return;
          seen.add(key);
          merged.push(product);
        };

        gqlResult?.allProducts.forEach(suggestion => {
          const product = mapSuggestionToProduct(suggestion);
          if (product) push(product);
        });
        restProducts.forEach(product => push(mapSearchProductToProduct(product)));

        /**
         * Client-side shop filter, still required even though the server now scopes by
         * shopIds: SmartBiz results never pass through the server, `storeVendors` loads
         * asynchronously so an early search sends an empty shopIds list (which the
         * server treats as "no filter"), and restrictCategory has no server-side
         * representation at all.
         */
        const allowedShopIds = new Set(validShopIds);
        if (API_STORE_ID && restrictCategory !== 'Food') allowedShopIds.add(API_STORE_ID);

        /**
         * Shops that are currently shut. Computed here rather than server-side because
         * "closed" is a function of the CURRENT TIME against opening/closing hours —
         * the server only knows the store_active flag, not whether the shop is open
         * right now. A vendor absent from the store is left in: we cannot evaluate its
         * hours, and dropping it would remove the SmartBiz collection store entirely.
         */
        const closedShopIds = new Set(
          eligibleVendors
            .filter(
              v =>
                !isStoreOpen({
                  openingTime: v.openingTime,
                  closingTime: v.closingTime,
                  storeActive: v.storeActive,
                }).isOpen
            )
            .map(v => v.shopId)
        );

        // Don't surface what the user cannot buy: out-of-stock items, or anything
        // from a shop that is closed right now.
        const filteredProducts = merged.filter(
          p => allowedShopIds.has(p.shopId) && p.inStock !== false && !closedShopIds.has(p.shopId)
        );

        // Round-robin interleave by vendor so the first slots aren't dominated by
        // whichever shop returned the most matches — only 8 are shown before
        // "Show More", and one high-yield shop would otherwise take all of them.
        const productsByShop = new Map<string, Product[]>();
        for (const p of filteredProducts) {
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

        /**
         * Vendors: GraphQL decides membership and order, the store supplies the object.
         * A synthesised Vendor would be missing ~9 required fields and break
         * VendorProduct, which receives the whole object through navigation — so a
         * vendor we cannot hydrate is dropped rather than faked.
         */
        const vendorResults: SearchVendorResult[] = [];
        const vendorSeen = new Set<string>();

        gqlResult?.vendors.forEach(v => {
          if (!v.shopId || vendorSeen.has(v.shopId)) return;
          if (!allowedShopIds.has(v.shopId)) return;
          const stored = getVendorById(v.shopId);
          if (!stored) {
            console.warn(`[useSearch] GraphQL vendor ${v.shopId} not in vendorStore — skipped`);
            return;
          }
          vendorSeen.add(v.shopId);
          vendorResults.push({
            vendor: {
              ...stored,
              logo: v.logo ?? stored.logo,
              banner: v.banner ?? stored.banner,
              preparationTime: v.preparationTime ?? stored.preparationTime,
            },
            startingPrice: v.startingPrice,
          });
        });

        // Vendors matching by NAME. findVendorsForSearch matches shops by the products
        // they sell, so searching "Sagar" would otherwise miss the shop itself.
        searchVendorsByQuery(trimmed)
          .filter(v => allowedShopIds.has(v.shopId) && !vendorSeen.has(v.shopId))
          .forEach(v => {
            vendorSeen.add(v.shopId);
            vendorResults.push({ vendor: v, startingPrice: null });
          });

        // Vendors that own one of the surviving products, for the REST fallback path
        // where GraphQL supplied no vendor list at all.
        if (!gqlResult) {
          eligibleVendors
            .filter(v => !vendorSeen.has(v.shopId) && interleaved.some(p => p.shopId === v.shopId))
            .forEach(v => {
              vendorSeen.add(v.shopId);
              vendorResults.push({ vendor: v, startingPrice: null });
            });
        }

        setSearchResults({
          vendors: vendorResults.map(v => v.vendor),
          vendorResults,
          products: interleaved,
          categoryChips: gqlResult?.categoryChips ?? [],
          totalProductMatches: gqlResult?.totalProductMatches ?? interleaved.length,
        });
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults(EMPTY_RESULTS);
      } finally {
        setIsLoading(false);
      }
    },
    [storeVendors, restrictCategory, categoryFilter, getVendorById, searchVendorsByQuery]
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

  /**
   * Sets the filter AND re-runs the search in one go, passing the new value
   * explicitly. A useEffect on categoryFilter would also fire on the first search
   * and double-fetch.
   */
  const selectCategoryChip = useCallback(
    async (categoryId: string | null) => {
      setCategoryFilter(categoryId);
      if (searchQuery.trim()) {
        await performSearch(searchQuery, categoryId);
      }
    },
    [performSearch, searchQuery]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults(EMPTY_RESULTS);
    setHasSearched(false);
    setCategoryFilter(null);
  }, []);

  return {
    searchQuery,
    isLoading,
    searchResults,
    hasSearched,
    categoryFilter,
    setSearchQuery,
    performSearch,
    searchOnSuggestionSelect,
    selectCategoryChip,
    clearSearch,
  };
};
