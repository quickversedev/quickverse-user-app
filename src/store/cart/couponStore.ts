import { create } from 'zustand';
import couponService from '../../services/couponService';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount: string;
  minOrder: number;
  expiryDate: string;
}

interface CouponStore {
  appliedCoupons: Record<string, Coupon>; // key is cartId
  availableCoupons: Coupon[];
  isLoading: boolean;
  error: string | null;
  applyCoupon: (cartId: string, coupon: Coupon) => void;
  removeCoupon: (cartId: string) => void;
  getAppliedCoupon: (cartId: string) => Coupon | undefined;
  fetchVendorOffers: (vendorId: string) => Promise<void>;
  fetchCustomerOffers: (shopId?: string) => Promise<void>;
}

const useCouponStore = create<CouponStore>((set, get) => ({
  appliedCoupons: {},
  availableCoupons: [],
  isLoading: false,
  error: null,
  applyCoupon: (cartId, coupon) => {
    set(state => ({
      appliedCoupons: {
        ...state.appliedCoupons,
        [cartId]: coupon,
      },
    }));
  },
  removeCoupon: cartId => {
    set(state => {
      const newAppliedCoupons = { ...state.appliedCoupons };
      delete newAppliedCoupons[cartId];
      return { appliedCoupons: newAppliedCoupons };
    });
  },
  getAppliedCoupon: cartId => {
    return get().appliedCoupons[cartId];
  },
  fetchVendorOffers: async (vendorId: string) => {
    set({ isLoading: true, error: null });
    try {
      const offers = await couponService.getVendorOffers(vendorId);
      set({ availableCoupons: offers, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch vendor offers',
        isLoading: false,
      });
    }
  },
  fetchCustomerOffers: async (shopId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const offers = await couponService.getCustomerOffers(shopId);
      set({ availableCoupons: offers, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch customer offers',
        isLoading: false,
      });
    }
  },
}));

export default useCouponStore;
