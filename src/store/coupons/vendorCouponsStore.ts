import { create } from 'zustand';
import couponApi from '../../services/api/couponSevice';
import useConfigStore from '../configStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatCoupon(c: any): string {
  if (c.type === 'FREE_DELIVERY') {
    return c.mov && c.mov > 0 ? `Free delivery above ₹${c.mov}` : 'Free Delivery';
  }
  if (c.type === 'FIXED' && c.discountValue != null) {
    return `₹${c.discountValue} OFF`;
  }
  if (c.type === 'PERCENTAGE' && c.discountValue != null) {
    return `${c.discountValue}% OFF`;
  }
  return '';
}

interface VendorCouponsState {
  /** shopId → array of all formatted coupon labels */
  couponsByVendor: Record<string, string[]>;
  /** Global tick counter — increments every 3s, drives coupon rotation for all cards */
  tick: number;
  loading: boolean;
  fetchedVendors: Set<string>;
  fetchForVendors: (shopIds: string[], serviceType?: string) => Promise<void>;
  startRotation: () => void;
  stopRotation: () => void;
  invalidateCache: () => void;
}

let rotationTimer: ReturnType<typeof setInterval> | null = null;
/**
 * How many mounted screens currently want the rotation running.
 *
 * The timer is shared, so an unconditional stop on one screen's unmount would freeze
 * the coupon labels on every other screen still showing them — leaving a category
 * screen stuck on whichever offer happened to be visible when the user opened a
 * vendor. The interval is only torn down once the last consumer has gone.
 */
let rotationSubscribers = 0;

const useVendorCouponsStore = create<VendorCouponsState>((set, get) => ({
  couponsByVendor: {},
  tick: 0,
  loading: false,
  fetchedVendors: new Set(),

  startRotation: () => {
    rotationSubscribers += 1;
    if (rotationTimer) return;
    rotationTimer = setInterval(() => {
      set(s => ({ tick: s.tick + 1 }));
    }, 3000);
  },

  stopRotation: () => {
    rotationSubscribers = Math.max(0, rotationSubscribers - 1);
    if (rotationSubscribers > 0) return;
    if (rotationTimer) {
      clearInterval(rotationTimer);
      rotationTimer = null;
    }
  },

  fetchForVendors: async (shopIds: string[], serviceType = 'FOOD') => {
    // May be null if the cached config has no region; the coupon service resolves it.
    const regionId = useConfigStore.getState().getRegionId();

    const alreadyFetched = get().fetchedVendors;
    const toFetch = shopIds.filter(id => !alreadyFetched.has(id));
    if (toFetch.length === 0) return;

    set({ loading: true });

    const results = await Promise.allSettled(
      toFetch.map(shopId =>
        couponApi
          .getAvailableCoupons(regionId, shopId, serviceType)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then((coupons: any[]) => {
            if (!coupons || coupons.length === 0) return { shopId, labels: [] as string[] };
            const labels = coupons.map(formatCoupon).filter(Boolean);
            return { shopId, labels };
          })
          .catch(() => ({ shopId, labels: [] as string[] }))
      )
    );

    const newCoupons: Record<string, string[]> = {};
    const newFetched = new Set(alreadyFetched);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.labels.length > 0) {
          newCoupons[result.value.shopId] = result.value.labels;
        }
        newFetched.add(result.value.shopId);
      }
    }

    set(state => ({
      couponsByVendor: { ...state.couponsByVendor, ...newCoupons },
      fetchedVendors: newFetched,
      loading: false,
    }));
  },

  invalidateCache: () => {
    get().stopRotation();
    set({ couponsByVendor: {}, fetchedVendors: new Set(), loading: false, tick: 0 });
  },
}));

export default useVendorCouponsStore;
