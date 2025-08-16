import axiosInstance, { API_CONFIG, apiCall } from '../config/api/axios.config';

// Mock data toggle
const USE_PRODUCT_DETAILS_MOCKS = true; // Set to false for real API

// Define proper interfaces to replace 'any' types
export interface ProductAttribute {
  key: string;
  value: string | number | boolean;
}

export interface ProductImage {
  url: string;
  alt?: string;
  caption?: string;
}

export interface ProductTag {
  id: string;
  name: string;
  color?: string;
}

// Mock product details data
const mockProductDetails: ProductDetailsResponse = {
  sku: 'aefabcd',
  shopId: '4513',
  name: 'Organic Fresh Milk',
  mrp: 120.0,
  sellingPrice: 95.0,
  gst: 4.5,
  category: 'Dairy',
  division: 'Cold',
  subDivision: 'Milk',
  brand: 'Organic Valley',
  attributes: {},
  imageUrl: 'https://m.media-amazon.com/images/I/71QKQ9mwV7L._AC_UL480_FMwebp_QL65_.jpg',
  additionalImages: [],
  discount: 25.0,
  numberOfVariants: 3,
  currentStock: 50,
  inStock: true,
  primarySKU: 'defabc',
  variantAttributes: [{ sku: 'aefabcd' }],
  tags: [],
};

// Mock variants data
const mockVariants: ProductVariant[] = [
  {
    id: 'variant_1',
    sku: 'variant_1',
    name: '1 scoop (250ml)',
    price: 69,
    mrp: 79,
    inStock: true,
    currentStock: 10,
    imageUrl: 'https://via.placeholder.com/60x60?text=1+Scoop',
    description: 'Single scoop serving',
    unit: 'scoop',
    size: '250ml',
  },
  {
    id: 'variant_2',
    sku: 'variant_2',
    name: '2 scoops (500ml)',
    price: 69,
    mrp: 79,
    inStock: false,
    currentStock: 0,
    imageUrl: 'https://via.placeholder.com/60x60?text=2+Scoops',
    description: 'Double scoop serving',
    unit: 'scoops',
    size: '500ml',
  },
  {
    id: 'variant_3',
    sku: 'variant_3',
    name: '3 scoops (750ml)',
    price: 89,
    mrp: 99,
    inStock: true,
    currentStock: 5,
    imageUrl: 'https://via.placeholder.com/60x60?text=3+Scoops',
    description: 'Triple scoop serving',
    unit: 'scoops',
    size: '750ml',
  },
];

// Helper function to simulate API delay
const simulateApiDelay = (ms: number = 800): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Product Details API Response Types
export interface ProductDetailsResponse {
  sku: string;
  shopId: string;
  name: string;
  mrp: number;
  sellingPrice: number;
  gst: number;
  category: string;
  division: string;
  subDivision: string;
  brand: string;
  attributes: Record<string, ProductAttribute>;
  imageUrl: string;
  additionalImages: ProductImage[];
  discount: number;
  numberOfVariants: number;
  currentStock: number;
  inStock: boolean;
  primarySKU: string;
  variantAttributes: Array<{ sku: string }>;
  tags: ProductTag[];
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  mrp: number;
  inStock: boolean;
  currentStock: number;
  imageUrl?: string;
  description?: string;
  unit?: string;
  size?: string;
}

export interface RelatedProduct {
  productId: string;
  productName: string;
  productImageUrl: string;
  sellingPrice: number;
  mrp: number;
  discount: number;
  rating: number;
}

// Variants response interface to match the expected format
export interface VariantsResponse {
  success: boolean;
  data: ProductVariant[];
  message?: string;
}

class ProductDetailsService {
  private baseUrl = `${API_CONFIG.baseURL}/v3`;

  /**
   * Fetch product details by product ID
   */
  async getProductDetails(
    productId: string,
    includeVariants: boolean = false
  ): Promise<ProductDetailsResponse> {
    try {
      if (USE_PRODUCT_DETAILS_MOCKS) {
        // Simulate API delay for realistic experience
        await simulateApiDelay();

        // Return mock data with the requested productId
        return {
          ...mockProductDetails,
          sku: productId, // Use the actual productId from the request
        };
      }

      // Real API call
      const response = await apiCall(
        axiosInstance.get<ProductDetailsResponse>(`/product/${productId}`, {
          params: {
            variant: includeVariants,
          },
          headers: {
            Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
          },
        })
      );

      return response;
    } catch (error) {
      console.error('Get product details error:', error);
      throw error;
    }
  }

  /**
   * Fetch multiple products by IDs
   */
  async getMultipleProductDetails(productIds: string[]): Promise<ProductDetailsResponse[]> {
    try {
      if (USE_PRODUCT_DETAILS_MOCKS) {
        // Simulate API delay for realistic experience
        await simulateApiDelay();

        // Return mock data for each productId
        return productIds.map(productId => ({
          ...mockProductDetails,
          sku: productId,
        }));
      }

      // Real API calls
      const promises = productIds.map(id => this.getProductDetails(id));
      const responses = await Promise.all(promises);
      return responses;
    } catch (error) {
      console.error('Get multiple product details error:', error);
      throw error;
    }
  }

  /**
   * Fetch product variants by parent SKU
   */
  async getProductVariants(parentSku: string): Promise<VariantsResponse> {
    try {
      if (USE_PRODUCT_DETAILS_MOCKS) {
        // Simulate API delay for realistic experience
        await simulateApiDelay();

        // Return mock variants data
        return {
          success: true,
          data: mockVariants,
        };
      }

      // Real API call - fetch product details with variants=true
      const response = await apiCall(
        axiosInstance.get<ProductDetailsResponse>(`/product/${parentSku}`, {
          params: {
            variant: true,
          },
          headers: {
            Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
          },
        })
      );

      // Transform the response to match VariantsResponse format
      // This assumes the API returns variant information in the product details response
      // You may need to adjust this based on the actual API response structure
      const variants: ProductVariant[] =
        response.variantAttributes?.map((attr, index) => ({
          id: `variant_${index + 1}`,
          sku: attr.sku,
          name: `${response.name} - Variant ${index + 1}`,
          price: response.sellingPrice,
          mrp: response.mrp,
          inStock: response.inStock,
          currentStock: response.currentStock,
          imageUrl: response.imageUrl,
          description: `Variant ${index + 1}`,
          unit: 'unit',
          size: 'Standard',
        })) || [];

      return {
        success: true,
        data: variants,
      };
    } catch (error) {
      console.error('Get product variants error:', error);

      let errorMessage = 'Failed to fetch variants';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        data: [],
        message: errorMessage,
      };
    }
  }
}

// Export control functions for external use
export const setUseProductDetailsMocks = (useMocks: boolean) => {
  // Note: This would need to be implemented with a more sophisticated state management
  // For now, you can manually change the constant above
  // eslint-disable-next-line no-console
  console.log(`Product Details Mock Mode: ${useMocks ? 'ENABLED' : 'DISABLED'}`);
  // eslint-disable-next-line no-console
  console.log(
    'To change this setting, modify USE_PRODUCT_DETAILS_MOCKS in productDetailsService.ts'
  );
};

export const getProductDetailsMockStatus = () => {
  return USE_PRODUCT_DETAILS_MOCKS;
};

// Export the service instance
export default new ProductDetailsService();

// Export a convenience function for fetching variants
export const fetchVariantsByParentSku = async (parentSku: string): Promise<VariantsResponse> => {
  return new ProductDetailsService().getProductVariants(parentSku);
};
