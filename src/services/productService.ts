import { Product } from '../types/product';

// TODO: Replace with actual API base URL
const API_BASE_URL = 'https://api.quickverse.com';

export interface FeaturedProductsResponse {
  success: boolean;
  data: Product[];
  message?: string;
}

class ProductService {
  /**
   * Fetch featured products for a specific vendor
   * @param vendorId - The vendor's shop ID
   * @param limit - Number of products to fetch (default: 10)
   * @returns Promise<FeaturedProductsResponse>
   */
  async getFeaturedProducts(
    vendorId: string,
    limit: number = 10
  ): Promise<FeaturedProductsResponse> {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}/featured-products?limit=${limit}`, {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // return data;

      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 10000)); // Simulate network delay

      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Schezwan Rice',
          price: 69,
          mrp: 79,
          image: require('../assets/images/bg_1.png'),
          numberOfVariants: 2,
          variantAttributes: [
            {
              name: 'Color',
            },
            {
              name: 'Size',
            },
          ],
          rating: 4.5,
          discount: 50,
          quantity: 0,
        },
        {
          id: '2',
          name: 'Chicken Biryani',
          price: 120,
          mrp: 150,
          image: require('../assets/images/bg_1.png'),
          rating: 4.3,
          discount: 20,
          quantity: 0,
        },
        {
          id: '3',
          name: 'Veg Fried Rice',
          price: 85,
          mrp: 95,
          image: require('../assets/images/bg_1.png'),
          rating: 4.1,
          discount: 10,
          quantity: 0,
        },
        {
          id: '4',
          name: 'Butter Chicken',
          price: 180,
          mrp: 220,
          image: require('../assets/images/bg_1.png'),
          rating: 4.7,
          discount: 18,
          quantity: 0,
        },
        {
          id: '5',
          name: 'Paneer Tikka',
          price: 140,
          mrp: 160,
          image: require('../assets/images/bg_1.png'),
          rating: 4.2,
          discount: 12,
          quantity: 0,
        },
      ];

      return {
        success: true,
        data: mockProducts.slice(0, limit),
      };
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to fetch featured products',
      };
    }
  }

  /**
   * Fetch all products for a vendor with pagination
   * @param vendorId - The vendor's shop ID
   * @param page - Page number (default: 1)
   * @param limit - Number of products per page (default: 20)
   * @returns Promise<FeaturedProductsResponse>
   */
  async getVendorProducts(
    vendorId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<FeaturedProductsResponse> {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}/products?page=${page}&limit=${limit}`, {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // return data;

      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Schezwan Rice',
          price: 69,
          mrp: 79,
          image: require('../assets/images/bg_1.png'),
          rating: 4.5,
          discount: 50,
          quantity: 0,
        },
        {
          id: '2',
          name: 'Chicken Biryani',
          price: 120,
          mrp: 150,
          image: require('../assets/images/bg_1.png'),
          rating: 4.3,
          discount: 20,
          quantity: 0,
        },
        {
          id: '3',
          name: 'Veg Fried Rice',
          price: 85,
          mrp: 95,
          image: require('../assets/images/bg_1.png'),
          rating: 4.1,
          discount: 10,
          quantity: 0,
        },
      ];

      return {
        success: true,
        data: mockProducts,
      };
    } catch (error) {
      console.error('Error fetching vendor products:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to fetch vendor products',
      };
    }
  }
}

export default new ProductService();
