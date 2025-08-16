import axiosInstance from '../../config/api/axios.config';

export interface SearchProduct {
  productSKU: string;
  productName: string;
  shopId: string;
  productImage: string;
}

export interface SearchResponse {
  products: SearchProduct[];
  vendors?: any[]; // Add vendor type when available
}

export interface SearchParams {
  query: string;
}

class SearchService {
  private readonly baseURL = '/v3/search';
  private readonly authHeader = 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx';

  /**
   * Search for products and vendors
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    try {
      const { query } = params;
      console.log('query', query);
      // Use the correct search endpoint with keyword parameter
      const response = await axiosInstance.get('v3/search', {
        params: {
          keyword: query,
        },
        headers: {
          Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
        },
      });

      // Transform the response to match our expected format
      const products = Array.isArray(response.data) ? response.data : [response.data];

      return {
        products: products.map((item: any) => ({
          productSKU: item.productSKU || item.sku || '',
          productName: item.productName || item.name || '',
          shopId: item.shopId || '',
          productImage: item.productImage || item.imageUrl || '',
        })),
        vendors: [], // Add vendors when API supports it
      };
    } catch (error) {
      console.error('Search API error:', error);
      throw new Error('Failed to search products');
    }
  }

  /**
   * Search with debouncing - returns a promise that resolves after delay
   */
  debouncedSearch(params: SearchParams, delay: number = 500): Promise<SearchResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await this.search(params);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
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
}

export default new SearchService();
