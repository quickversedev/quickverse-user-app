import axiosInstance, { apiCall } from '../../config/api/axios.config';

export interface SearchProduct {
  productSKU: string;
  productName: string;
  shopId: string;
  productImage: string;
  // Optional additional fields from variant response
  veg?: boolean;
  price?: number; // sellingPrice
  mrp?: number;
  discount?: number;
  inStock?: boolean;
}

export interface SearchVendor {
  vendorId: string;
  vendorName: string;
  vendorImage?: string;
}

export interface SearchResponse {
  products: SearchProduct[];
  vendors?: SearchVendor[];
}

export interface SearchParams {
  query: string;
}

interface ApiSearchItem {
  productSKU?: string;
  sku?: string;
  productName?: string;
  name?: string;
  shopId?: string;
  productImage?: string;
  imageUrl?: string;
  veg?: boolean;
  sellingPrice?: number;
  mrp?: number;
  discount?: number;
  inStock?: boolean;
}

class SearchService {
  private readonly authHeader = 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx';
  private debounceTimeoutId: NodeJS.Timeout | null = null;

  /**
   * Search for products and vendors
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    try {
      const { query } = params;

      // Use the correct search endpoint with keyword parameter
      const response = await apiCall(
        axiosInstance.get('v3/search', {
          params: {
            keyword: query,
          },
          headers: {
            Authorization: this.authHeader,
          },
        })
      );

      // Transform the response to match our expected format
      const products = Array.isArray(response) ? response : [response];

      return {
        products: products.map((item: ApiSearchItem) => ({
          productSKU: item.productSKU || item.sku || '',
          productName: item.productName || item.name || '',
          shopId: item.shopId || '',
          productImage: item.productImage || item.imageUrl || '',
          veg: item.veg,
          price: item.sellingPrice,
          mrp: item.mrp,
          discount: item.discount,
          inStock: item.inStock,
        })),
        vendors: [], // Add vendors when API supports it
      };
    } catch (error) {
      // Use proper error logging instead of console.error
      throw new Error(
        `Failed to search products: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * True debounced search - cancels previous requests and waits for user to stop typing
   */
  debouncedSearch(params: SearchParams, delay: number = 500): Promise<SearchResponse> {
    return new Promise((resolve, reject) => {
      // Clear any existing timeout
      if (this.debounceTimeoutId) {
        clearTimeout(this.debounceTimeoutId);
      }

      // Set new timeout
      this.debounceTimeoutId = setTimeout(async () => {
        try {
          const result = await this.search(params);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceTimeoutId = null;
        }
      }, delay);
    });
  }

  /**
   * Cancel any pending debounced search
   */
  cancelDebouncedSearch(): void {
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
      this.debounceTimeoutId = null;
    }
  }

  /**
   * Mock search for development/testing
   */
  async mockSearch(query: string): Promise<SearchResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockProducts: SearchProduct[] = [
      {
        productSKU: 'pizza-001',
        productName: 'Margherita Pizza',
        shopId: 'shop-1',
        productImage:
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
      },
      {
        productSKU: 'burger-001',
        productName: 'Classic Burger',
        shopId: 'shop-2',
        productImage:
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      },
      {
        productSKU: 'sushi-001',
        productName: 'California Roll',
        shopId: 'shop-3',
        productImage:
          'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
      },
    ];

    // Filter based on query
    const filteredProducts = mockProducts.filter(
      product =>
        product.productName.toLowerCase().includes(query.toLowerCase()) ||
        product.productSKU.toLowerCase().includes(query.toLowerCase())
    );

    return {
      products: filteredProducts,
      vendors: [],
    };
  }

  /**
   * Search for products in a specific collection/store via Smartbiz API
   */
  async searchCollection(storeId: string, query: string): Promise<SearchProduct[]> {
    console.log(
      `[SearchService] searchCollection called with storeId: ${storeId}, query: ${query}`
    );
    try {
      const url = `https://api.smartbiz.in/stores/${storeId}/catalog/items?searchString=${encodeURIComponent(
        query
      )}&pageSize=100&offset=0`;
      console.log(`[SearchService] Fetching: ${url}`);

      // Direct call to Smartbiz API
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          Origin: 'https://www.smartbiz.in',
          Referer: 'https://www.smartbiz.in/',
        },
      });

      console.log(`[SearchService] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SearchService] API Error: ${response.status} - ${errorText}`);
        throw new Error(`Smartbiz API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        '[SearchService] Raw data received:',
        JSON.stringify(data).substring(0, 200) + '...'
      );

      // Map response to SearchProduct
      // API returns a list of items directly or in a wrapper
      // Based on curl response assumption (standard list or paged list)
      const items = Array.isArray(data)
        ? data
        : data.searchResultDataDocuments || data.products || data.items || [];

      console.log(`[SearchService] Parsed items count: ${items.length}`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedItems = items.map((item: any) => ({
        productSKU: item.sku || item.id || '',
        productName: item.name || '',
        shopId: storeId,
        productImage: item.imageUrl || item.image || (item.images && item.images[0]) || '',
        veg: item.veg,
        price: item.sellingPrice || item.price,
        mrp: item.mrp,
        discount: item.discount,
        inStock: item.inStock ?? true,
      }));

      console.log(`[SearchService] Mapped items count: ${mappedItems.length}`);
      return mappedItems;
    } catch (error) {
      console.error('[SearchService] Smartbiz search failed:', error);
      return [];
    }
  }
}

export default new SearchService();
