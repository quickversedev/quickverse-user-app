import { ClientError } from 'graphql-request';
import {
  graphqlClient,
  GRAPHQL_TIMEOUT,
  SEARCH_GRAPHQL_SUPPORTS_SHOP_IDS,
} from '../../config/api/graphql.config';
import { getAuthHeader } from '../../config/api/axios.config';
import { ApiError } from '../../config/api/axios.types';
import { Product } from '../../types/product';

/**
 * GraphQL search transport.
 *
 * The public surface here is deliberately plain async functions and plain objects —
 * no GraphQLClient, no DocumentNode leaks to callers. graphql-request statically
 * imports graphql-js (~500KB) for one query, so keeping the boundary narrow means
 * swapping to a bare axios POST later is a single-file change.
 */

/** Every scalar in these types is nullable in the schema — model that honestly. */
export interface GqlProductSuggestion {
  productSKU: string | null;
  productName: string | null;
  shopId: string | null;
  productImage: string | null;
  mrp: number | null;
  sellingPrice: number | null;
  discount: number | null;
  inStock: boolean | null;
}

export interface GqlVendorSearchResult {
  shopId: string | null;
  name: string | null;
  logo: string | null;
  banner: string | null;
  preparationTime: string | null;
  startingPrice: number | null;
}

export interface GqlSearchCategoryChip {
  categoryId: string | null;
  categoryName: string | null;
  matchingCount: number | null;
}

export interface GqlSearchResult {
  topProducts: GqlProductSuggestion[];
  allProducts: GqlProductSuggestion[];
  totalProductMatches: number;
  vendors: GqlVendorSearchResult[];
  categoryChips: GqlSearchCategoryChip[];
}

interface SearchQueryResponse {
  search: GqlSearchResult | null;
}

const SEARCH_FIELDS = `
  topProducts { productSKU productName shopId productImage mrp sellingPrice discount inStock }
  allProducts { productSKU productName shopId productImage mrp sellingPrice discount inStock }
  totalProductMatches
  vendors { shopId name logo banner preparationTime startingPrice }
  categoryChips { categoryId categoryName matchingCount }
`;

/**
 * Two documents rather than one with a conditionally-omitted variable: the query TEXT
 * declares $shopIds, so a server without that argument rejects the whole document with
 * HTTP 400 regardless of whether a value is sent.
 *
 * `topProducts` is requested without its `limit` argument on purpose — the server
 * advertises `topProducts(limit: Int = 3)` but has no @SchemaMapping for it, so the
 * argument is silently ignored.
 */
export const SEARCH_QUERY_WITH_SHOP_IDS = `
  query Search($keyword: String!, $categoryFilter: String, $shopIds: [String!]) {
    search(keyword: $keyword, categoryFilter: $categoryFilter, shopIds: $shopIds) {
      ${SEARCH_FIELDS}
    }
  }
`;

export const SEARCH_QUERY = `
  query Search($keyword: String!, $categoryFilter: String) {
    search(keyword: $keyword, categoryFilter: $categoryFilter) {
      ${SEARCH_FIELDS}
    }
  }
`;

const EMPTY_RESULT: GqlSearchResult = {
  topProducts: [],
  allProducts: [],
  totalProductMatches: 0,
  vendors: [],
  categoryChips: [],
};

/**
 * Maps a suggestion onto the app's Product shape.
 *
 * Returns null for an unaddressable product (no SKU or no shop) rather than emitting a
 * broken row — the caller filters those out. Missing prices coerce to 0, matching what
 * the REST path already did; ProductItemOnSearch only renders a price when > 0.
 */
export const mapSuggestionToProduct = (s: GqlProductSuggestion): Product | null => {
  if (!s.productSKU || !s.shopId) return null;

  return {
    sku: s.productSKU,
    name: s.productName ?? '',
    imageUrl: s.productImage ?? '',
    shopId: s.shopId,
    mrp: s.mrp ?? 0,
    sellingPrice: s.sellingPrice ?? 0,
    rating: 0,
    discount: s.discount ?? 0,
    veg: true,
    numberOfVariants: 1,
    primarySKU: s.productSKU,
    inStock: s.inStock ?? true,
  } as Product;
};

const networkError = (message: string): ApiError => ({
  status: 0,
  message,
  code: 'NETWORK_ERROR',
  isCancelled: false,
  apiEndpoint: '/graphql',
});

/**
 * Normalises a graphql-request failure into the same ApiError shape axios produces.
 *
 * Not routed through apiCall(): that helper assumes an AxiosError, and GraphQL breaks
 * its assumptions — notably that a failure implies a non-2xx status.
 */
const toApiError = (err: unknown): ApiError => {
  if (err instanceof ClientError) {
    const status = err.response?.status ?? 500;
    const message = err.response?.errors?.[0]?.message || 'Search failed';
    return {
      status,
      message,
      // 400 here is almost always a schema mismatch — e.g. sending shopIds to a
      // server that predates the argument.
      code: status === 400 ? 'GRAPHQL_VALIDATION' : 'GRAPHQL_ERROR',
      isCancelled: false,
      apiEndpoint: '/graphql',
    };
  }

  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return {
        status: 408,
        message: 'Request timed out. Please check your internet connection and try again.',
        code: 'TIMEOUT',
        isCancelled: false,
        apiEndpoint: '/graphql',
      };
    }
    // fetch rejects with a TypeError when the host is unreachable.
    return networkError(err.message || 'Network error. Please check your internet connection.');
  }

  return networkError('An unexpected error occurred');
};

export interface SearchGraphQLParams {
  keyword: string;
  categoryFilter?: string | null;
  shopIds?: string[];
}

export const searchGraphQL = async ({
  keyword,
  categoryFilter,
  shopIds,
}: SearchGraphQLParams): Promise<GqlSearchResult> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GRAPHQL_TIMEOUT);

  const useShopIds = SEARCH_GRAPHQL_SUPPORTS_SHOP_IDS && Array.isArray(shopIds);

  try {
    const data = await graphqlClient.request<SearchQueryResponse>({
      document: useShopIds ? SEARCH_QUERY_WITH_SHOP_IDS : SEARCH_QUERY,
      variables: useShopIds
        ? { keyword, categoryFilter: categoryFilter ?? null, shopIds }
        : { keyword, categoryFilter: categoryFilter ?? null },
      signal: controller.signal,
      requestHeaders: {
        // The endpoint is unauthenticated today (no interceptor matches /graphql).
        // Sent anyway so nothing breaks the day it is put behind one.
        Authorization: getAuthHeader(),
        'Request-Origin': 'CUSTOMER',
      },
    });

    return data.search ?? EMPTY_RESULT;
  } catch (err) {
    /**
     * A GraphQL response can be HTTP 200 with BOTH partial data and an errors[] array.
     * graphql-request throws a ClientError in that case. If the product list survived,
     * return it: the server already swallows its own per-section failures and returns
     * empty lists, so discarding good products because one resolver hiccuped would be a
     * regression against the REST behaviour.
     */
    if (err instanceof ClientError) {
      const partial = (err.response?.data as SearchQueryResponse | undefined)?.search;
      if (partial) {
        console.warn('[searchGraphQL] partial result with errors', err.response?.errors);
        return partial;
      }
    }
    throw toApiError(err);
  } finally {
    clearTimeout(timer);
  }
};
