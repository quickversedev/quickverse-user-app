import { create } from 'zustand';
import { getVendorMockCoupons, simulateApiDelay } from '../../assets/mock/couponMockData';
import { ApiError } from '../../config/api/axios.types';
import couponService from '../../services/couponService';
import { AuthSession } from '../../services/localStorage/storage.service';
import useCartStore from './cartStore';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount: string;
  minOrder: number;
  expiryDate: string;
  // New fields for enhanced API
  offerType?: string;
  discountLimit?: number;
  totalBenefit?: number;
  offerClass?: string;
  applicableEntities?: Array<{
    entityId: string;
    entityType: string;
    quantityLimit: number | null;
  }>;
  minProductCount?: number;
  // Eligibility information
  isEligible?: boolean;
  constraintSuggestions?: string[];
  benefitSuggestions?: string[];
  totalAmountRequired?: number;
  minimumOrderAmount?: number; // API field name
}

interface CouponStore {
  appliedCoupons: Record<string, Coupon>; // key is cartId
  availableCoupons: Record<string, Coupon[]>; // key is vendorId
  vendorOffersLoading: boolean;
  vendorOffersError: string | null;
  customerOffersLoading: boolean;
  customerOffersError: string | null;
  applyCouponLoading: boolean;
  applyCouponError: string | null;
  applyCoupon: (cartId: string, coupon: Coupon) => void;
  applyOfferToCart: (
    cartId: string,
    vendorId: string,
    coupon: Coupon,
    authData?: AuthSession
  ) => Promise<void>;
  removeCoupon: (cartId: string) => void;
  getAppliedCoupon: (cartId: string) => Coupon | undefined;
  getAvailableCoupons: (vendorId: string) => Coupon[];
  fetchVendorOffers: (vendorId: string, authData?: AuthSession) => Promise<void>;
  fetchCustomerOffers: (
    vendorId: string,
    _shopId?: string,
    authData?: AuthSession
  ) => Promise<void>;
  checkAndFetchOffers: (vendorId: string, authData?: AuthSession) => Promise<void>;
  clearVendorOffers: (vendorId: string) => void;
}

// Mock data control
const USE_COUPON_MOCKS = false; // Set to false for real API

// Request debouncing mechanism
let currentRequestId = 0;
let pendingRequest: AbortController | null = null;

const useCouponStore = create<CouponStore>((set, get) => ({
  appliedCoupons: {},
  availableCoupons: {},
  vendorOffersLoading: false,
  vendorOffersError: null,
  customerOffersLoading: false,
  customerOffersError: null,
  applyCouponLoading: false,
  applyCouponError: null,

  applyCoupon: (cartId: string, coupon: Coupon) => {
    set(state => ({
      appliedCoupons: {
        ...state.appliedCoupons,
        [cartId]: coupon,
      },
    }));
  },

  applyOfferToCart: async (cartId, vendorId, coupon, authData) => {
    try {
      set({ applyCouponLoading: true, applyCouponError: null });
      const shopId = vendorId;
      const offerIdOrCode = coupon.id;

      if (!authData?.jwt) {
        throw new Error('No authentication token available');
      }

      const apiResponse = await couponService.applyOffer(shopId, offerIdOrCode, false, authData);

      // Sync cart store with latest totals/products
      useCartStore.getState().syncCartWithApi(cartId, apiResponse);

      // Mark coupon as applied in this store
      set(state => ({
        appliedCoupons: {
          ...state.appliedCoupons,
          [cartId]: coupon,
        },
        applyCouponLoading: false,
      }));
    } catch (err: unknown) {
      const error = err as ApiError | Error;
      let errorMessage = 'Failed to apply coupon';
      if ('code' in (error as any) && 'status' in (error as any)) {
        const apiError = error as ApiError;
        errorMessage = apiError.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      set({ applyCouponError: errorMessage, applyCouponLoading: false });
      throw error;
    }
  },

  removeCoupon: (cartId: string) => {
    set(state => {
      const newAppliedCoupons = { ...state.appliedCoupons };
      delete newAppliedCoupons[cartId];
      return { appliedCoupons: newAppliedCoupons };
    });
  },

  getAppliedCoupon: (cartId: string) => {
    return get().appliedCoupons[cartId];
  },

  getAvailableCoupons: (vendorId: string) => {
    return get().availableCoupons[vendorId] || [];
  },

  fetchVendorOffers: async (vendorId: string, authData?: AuthSession) => {
    // Cancel any pending request
    if (pendingRequest) {
      pendingRequest.abort();
    }

    // Create new request ID and abort controller
    const requestId = ++currentRequestId;
    const abortController = new AbortController();
    pendingRequest = abortController;

    set({ vendorOffersLoading: true, vendorOffersError: null });

    try {
      if (USE_COUPON_MOCKS) {
        // Use mock data from separate file
        const mockCoupons = getVendorMockCoupons(vendorId);

        // Simulate API delay
        await simulateApiDelay();

        // Only update if this is still the current request
        if (requestId === currentRequestId) {
          set(state => ({
            availableCoupons: {
              ...state.availableCoupons,
              [vendorId]: mockCoupons,
            },
            vendorOffersLoading: false,
          }));
        }
      } else {
        // Use real API
        const offers = await couponService.getVendorOffers(vendorId, authData);

        // Only update if this is still the current request
        if (requestId === currentRequestId) {
          set(state => ({
            availableCoupons: {
              ...state.availableCoupons,
              [vendorId]: offers,
            },
            vendorOffersLoading: false,
          }));
        }
      }
    } catch (err: unknown) {
      const error = err as ApiError | Error;

      // Don't update state if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      // Only update error state if this is still the current request
      if (requestId === currentRequestId) {
        let errorMessage = 'Failed to fetch vendor offers';

        // Handle ApiError from axios.config.ts
        if ('code' in error && 'status' in error) {
          const apiError = error as ApiError;
          errorMessage = apiError.message || 'Failed to fetch vendor offers';

          // Log additional error details for debugging
          console.error('Coupon API Error:', {
            status: apiError.status,
            code: apiError.code,
            message: apiError.message,
            endpoint: apiError.apiEndpoint,
          });
        } else if (error instanceof Error) {
          errorMessage = error.message || 'Failed to fetch vendor offers';
        }

        set({ vendorOffersError: errorMessage, vendorOffersLoading: false });
      }
    } finally {
      // Clear pending request if this was the current one
      if (requestId === currentRequestId) {
        pendingRequest = null;
      }
    }
  },

  fetchCustomerOffers: async (vendorId: string, _shopId?: string, authData?: AuthSession) => {
    // Cancel any pending request
    if (pendingRequest) {
      pendingRequest.abort();
    }

    // Create new request ID and abort controller
    const requestId = ++currentRequestId;
    const abortController = new AbortController();
    pendingRequest = abortController;

    set({ customerOffersLoading: true, customerOffersError: null });

    try {
      if (USE_COUPON_MOCKS) {
        // Use mock data from separate file
        const mockCoupons = getVendorMockCoupons(vendorId);

        // Simulate API delay
        await simulateApiDelay();

        // Only update if this is still the current request
        if (requestId === currentRequestId) {
          set(state => ({
            availableCoupons: {
              ...state.availableCoupons,
              [vendorId]: mockCoupons,
            },
            customerOffersLoading: false,
          }));
        }
      } else {
        // Use real API
        const offers = await couponService.getCustomerOffers(_shopId, authData);

        // Only update if this is still the current request
        if (requestId === currentRequestId) {
          set(state => ({
            availableCoupons: {
              ...state.availableCoupons,
              [vendorId]: offers,
            },
            customerOffersLoading: false,
          }));
        }
      }
    } catch (err: unknown) {
      const error = err as ApiError | Error;

      // Don't update state if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      // Only update error state if this is still the current request
      if (requestId === currentRequestId) {
        let errorMessage = 'Failed to fetch customer offers';

        // Handle ApiError from axios.config.ts
        if ('code' in error && 'status' in error) {
          const apiError = error as ApiError;
          errorMessage = apiError.message || 'Failed to fetch customer offers';

          // Log additional error details for debugging
          console.error('Coupon API Error:', {
            status: apiError.status,
            code: apiError.code,
            message: apiError.message,
            endpoint: apiError.apiEndpoint,
          });
        } else if (error instanceof Error) {
          errorMessage = error.message || 'Failed to fetch customer offers';
        }

        set({ customerOffersError: errorMessage, customerOffersLoading: false });
      }
    } finally {
      // Clear pending request if this was the current one
      if (requestId === currentRequestId) {
        pendingRequest = null;
      }
    }
  },

  checkAndFetchOffers: async (vendorId: string, authData?: AuthSession) => {
    // Cancel any pending request
    if (pendingRequest) {
      pendingRequest.abort();
    }

    // Create new request ID and abort controller
    const requestId = ++currentRequestId;
    const abortController = new AbortController();
    pendingRequest = abortController;

    set({ vendorOffersLoading: true, vendorOffersError: null });

    try {
      if (USE_COUPON_MOCKS) {
        // Use mock data from separate file
        const mockCoupons = getVendorMockCoupons(vendorId);

        // Simulate API delay
        await simulateApiDelay();

        // Only update if this is still the current request
        if (requestId === currentRequestId) {
          set(state => ({
            availableCoupons: {
              ...state.availableCoupons,
              [vendorId]: mockCoupons,
            },
            vendorOffersLoading: false,
          }));
        }
      } else {
        // Use real API - first check vendor offers, then fetch customer offers if available
        const offers = await couponService.getVendorOffers(vendorId, authData);

        // Only update if this is still the current request
        if (requestId === currentRequestId) {
          set(state => ({
            availableCoupons: {
              ...state.availableCoupons,
              [vendorId]: offers,
            },
            vendorOffersLoading: false,
          }));
        }
      }
    } catch (err: unknown) {
      const error = err as ApiError | Error;

      // Don't update state if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      // Only update error state if this is still the current request
      if (requestId === currentRequestId) {
        let errorMessage = 'Failed to check and fetch offers';

        // Handle ApiError from axios.config.ts
        if ('code' in error && 'status' in error) {
          const apiError = error as ApiError;
          errorMessage = apiError.message || 'Failed to check and fetch offers';

          // Log additional error details for debugging
          console.error('Coupon API Error:', {
            status: apiError.status,
            code: apiError.code,
            message: apiError.message,
            endpoint: apiError.apiEndpoint,
          });
        } else if (error instanceof Error) {
          errorMessage = error.message || 'Failed to check and fetch offers';
        }

        set({ vendorOffersError: errorMessage, vendorOffersLoading: false });
      }
    } finally {
      // Clear pending request if this was the current one
      if (requestId === currentRequestId) {
        pendingRequest = null;
      }
    }
  },

  clearVendorOffers: (vendorId: string) => {
    set(state => {
      const newAvailableCoupons = { ...state.availableCoupons };
      delete newAvailableCoupons[vendorId];
      return { availableCoupons: newAvailableCoupons };
    });
  },
}));

// Export functions to control the mock data
export const toggleMockData = () => {
  // Note: This now requires a store restart to take effect
  console.warn('Mock data toggle requires store restart. Set USE_COUPON_MOCKS constant directly.');
};

export const setUseMockData = (_useMock: boolean) => {
  // Note: This now requires a store restart to take effect
  console.warn('Mock data setting requires store restart. Set USE_COUPON_MOCKS constant directly.');
};

export const getUseMockData = () => {
  return USE_COUPON_MOCKS;
};

export default useCouponStore;
