import { AUTHORIZATION_KEY } from '@env';
import axiosInstance, { apiCall } from '../config/api/axios.config';
import { Product } from '../types/product';

// Product Details API Response Types

// Mock data toggle
const USE_PRODUCT_DETAILS_MOCKS = false; // Set to false for real API

// Mock variants data
const mockVariants: Product[] = [
  {
    sku: 'variant_1',
    shopId: '4513',
    name: '1 scoop (250ml)',
    mrp: 79,
    sellingPrice: 69,
    rating: 4.5,
    discount: 12.7,
    veg: true,
    numberOfVariants: 1,
    currentStock: 10,
    inStock: true,
    primarySKU: 'variant_1',
    imageUrl: 'https://via.placeholder.com/60x60?text=1+Scoop',
    attributes: {
      color: null,
      size: '250ml',
      name: 'Single scoop serving',
      description: 'Single scoop serving',
      price: 69,
      unit: 'scoop',
    },
  },
  {
    sku: 'variant_2',
    shopId: '4513',
    name: '2 scoops (500ml)',
    mrp: 79,
    sellingPrice: 69,
    rating: 4.5,
    discount: 12.7,
    veg: true,
    numberOfVariants: 1,
    currentStock: 0,
    inStock: false,
    primarySKU: 'variant_2',
    imageUrl: 'https://via.placeholder.com/60x60?text=2+Scoops',
    attributes: {
      color: null,
      size: '500ml',
      name: 'Double scoop serving',
      description: 'Double scoop serving',
      price: 69,
      unit: 'scoops',
    },
  },
  {
    sku: 'variant_3',
    shopId: '4513',
    name: '3 scoops (750ml)',
    mrp: 99,
    sellingPrice: 89,
    rating: 4.5,
    discount: 10.1,
    veg: true,
    numberOfVariants: 1,
    currentStock: 5,
    inStock: true,
    primarySKU: 'variant_3',
    imageUrl: 'https://via.placeholder.com/60x60?text=3+Scoops',
    attributes: {
      color: null,
      size: '750ml',
      name: 'Triple scoop serving',
      description: 'Triple scoop serving',
      price: 89,
      unit: 'scoops',
    },
  },
];

// Helper function to simulate API delay
const simulateApiDelay = (ms: number = 800): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Product Details API Response Types

// Variants response interface to match the expected format
export interface VariantsResponse {
  success: boolean;
  data: Product[];
  message?: string;
}

class ProductDetailsService {
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
      //console.log('parentSku', parentSku);
      // Real API call - fetch product variants
      const apiResponse = await apiCall(
        axiosInstance.get<Product[]>(`/v3/product/${parentSku}`, {
          params: { variant: true },
          headers: {
            Authorization: AUTHORIZATION_KEY,
          },
        })
      );
      // The variants API may return an array of variant objects as shown in the sample.
      // Gracefully handle both array and legacy object formats.
      let variants: Product[] = [];
      if (Array.isArray(apiResponse)) {
        variants = apiResponse.map((item: Product, index: number) => ({
          sku: item.sku,
          shopId: item.shopId,
          name: item.name,
          mrp: typeof item.mrp === 'number' ? item.mrp : item.sellingPrice || 0,
          sellingPrice: typeof item.sellingPrice === 'number' ? item.sellingPrice : item.mrp || 0,
          rating: item.rating || 4.5,
          discount: item.discount || 0,
          veg: typeof item.veg === 'boolean' ? item.veg : true,
          numberOfVariants: 1,
          currentStock: typeof item.currentStock === 'number' ? item.currentStock : 0,
          inStock: typeof item.inStock === 'boolean' ? item.inStock : true,
          primarySKU: item.sku,
          imageUrl: item.imageUrl || '',
          attributes: {
            color: item.attributes?.color || null,
            size: item?.attributes?.size || null,
            name: item.name || `Variant ${index + 1}`,
            description: item?.attributes?.description || '',
            price: typeof item.sellingPrice === 'number' ? item.sellingPrice : item.mrp || 0,
            unit: item?.attributes?.unit || null,
          },
        }));
      }
      //console.log('variants', variants);
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

export const getProductDetailsMockStatus = () => {
  return USE_PRODUCT_DETAILS_MOCKS;
};

// Export the service instance
export default new ProductDetailsService();

// Export a convenience function for fetching variants
export const fetchVariantsByParentSku = async (parentSku: string): Promise<VariantsResponse> => {
  return new ProductDetailsService().getProductVariants(parentSku);
};
