import axiosInstance, { apiCall } from '../../config/api/axios.config';

export interface Variant {
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

export interface VariantsResponse {
  success: boolean;
  data: Variant[];
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export const fetchVariantsByParentSku = async (parentSku: string): Promise<VariantsResponse> => {
  try {
    const response = await apiCall(
      axiosInstance.get(`/products/${parentSku}/variants`),
      10000 // 10 second timeout for variants
    );

    if (response) {
      return {
        success: true,
        data: response.variants || [],
      };
    } else {
      return {
        success: false,
        data: [],
        message: 'No variants found',
      };
    }
  } catch (error: unknown) {
    console.error('Error fetching variants:', error);

    let errorMessage = 'Failed to fetch variants';
    let status: number | undefined;

    if (typeof error === 'object' && error !== null) {
      const apiError = error as { status?: number; message?: string };
      status = apiError.status;

      if (status === 404) {
        errorMessage = 'Product variants not found';
      } else if (status === 401) {
        errorMessage = 'Unauthorized access';
      } else if (status === 403) {
        errorMessage = 'Access forbidden';
      } else if (status === 408) {
        errorMessage = 'Request timeout. Please try again.';
      } else if (status && status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }
    }

    return {
      success: false,
      data: [],
      message: errorMessage,
    };
  }
};

// Mock function for development/testing
export const fetchVariantsByParentSkuMock = async (
  parentSku: string
): Promise<VariantsResponse> => {
  // Simulate API delay (1-2 seconds to feel more realistic)
  const delay = Math.random() * 1000 + 1000; // Random delay between 1-2 seconds
  await new Promise(resolve => setTimeout(resolve, delay));

  // Simulate occasional errors (10% chance)
  if (Math.random() < 0.1) {
    throw new Error('Simulated network error');
  }
  console.log('parentSku', parentSku);
  // Mock variants data
  const mockVariants: Variant[] = [
    {
      id: `${parentSku}_variant_1`,
      sku: `${parentSku}_1`,
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
      id: `${parentSku}_variant_2`,
      sku: `${parentSku}_2`,
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
      id: `${parentSku}_variant_3`,
      sku: `${parentSku}_3`,
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

  return {
    success: true,
    data: mockVariants,
  };
};
