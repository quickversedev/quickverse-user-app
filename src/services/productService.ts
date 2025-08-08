import { mockProducts } from '../assets/mock/products';
import { Product } from '../types/product';

// TODO: Replace with actual API base URL
const _API_BASE_URL = 'https://api.quickverse.com';

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
      // const response = await fetch(`${_API_BASE_URL}/vendors/${vendorId}/featured-products?limit=${limit}`, {
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

      // Mock response using mock products
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      // Filter products by shopId and get featured products (products with BestSeller tag)
      const shopProducts = mockProducts.filter(product => product.shopId === vendorId);
      const featuredProducts = shopProducts.filter(product =>
        product.tags.some(tag => tag.tagName === 'BestSeller')
      );

      // If no featured products found, return some random products from the shop
      const productsToReturn =
        featuredProducts.length > 0
          ? featuredProducts.slice(0, limit)
          : shopProducts.slice(0, limit);

      // Convert mock Product type to the expected Product type
      const convertedProducts: Product[] = productsToReturn.map(mockProduct => ({
        id: mockProduct.sku,
        sku: mockProduct.sku,
        shopId: mockProduct.shopId,
        name: mockProduct.name,
        price: mockProduct.sellingPrice,
        mrp: mockProduct.mrp,
        image: mockProduct.imageUrl,
        numberOfVariants: mockProduct.numberOfVariants,
        variantAttributes: [], // Mock products don't have variant attributes
        rating: 4.0 + Math.random() * 1.0, // Random rating between 4.0 and 5.0
        discount: mockProduct.discount,
        quantity: 0,
        category: mockProduct.category,
        description: mockProduct.description,
        brand: mockProduct.brand,
        inStock: mockProduct.inStock,
        currentStock: mockProduct.currentStock,
        tags: mockProduct.tags,
      }));

      return {
        success: true,
        data: convertedProducts,
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
   * @param _page - Page number (default: 1)
   * @param _limit - Number of products per page (default: 20)
   * @returns Promise<FeaturedProductsResponse>
   */
  async getVendorProducts(
    vendorId: string,
    _page: number = 1,
    _limit: number = 20
  ): Promise<FeaturedProductsResponse> {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${_API_BASE_URL}/vendors/${vendorId}/products?page=${_page}&limit=${_limit}`, {
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

      // Mock response using mock products
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

      // Filter products by shopId
      const shopProducts = mockProducts.filter(product => product.shopId === vendorId);

      // Convert mock Product type to the expected Product type
      const convertedProducts: Product[] = shopProducts.map(mockProduct => ({
        id: mockProduct.sku,
        sku: mockProduct.sku,
        shopId: mockProduct.shopId,
        name: mockProduct.name,
        price: mockProduct.sellingPrice,
        mrp: mockProduct.mrp,
        image: mockProduct.imageUrl,
        numberOfVariants: mockProduct.numberOfVariants,
        variantAttributes: [], // Mock products don't have variant attributes
        rating: 4.0 + Math.random() * 1.0, // Random rating between 4.0 and 5.0
        discount: mockProduct.discount,
        quantity: 0,
        category: mockProduct.category,
        description: mockProduct.description,
        brand: mockProduct.brand,
        inStock: mockProduct.inStock,
        currentStock: mockProduct.currentStock,
        tags: mockProduct.tags,
      }));

      return {
        success: true,
        data: convertedProducts,
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
