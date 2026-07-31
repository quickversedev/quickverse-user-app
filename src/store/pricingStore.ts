import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchPricingConfig } from '../services/api/pricingService';
import { PricingConfigItem, PricingValues, ServiceType } from '../types/pricing';
import { CACHE_TTL, createPersistedConfig, isCacheFresh } from '../utils/cache';

interface PricingStore {
  configs: Record<ServiceType, PricingConfigItem[]>;
  loading: boolean;
  error: string | null;
  _lastFetchedAt: Record<ServiceType, number>;

  fetchPricing: (serviceType: ServiceType) => Promise<void>;
  getPricingValues: (serviceType: ServiceType) => PricingValues;
  reset: () => void;
}

const DEFAULT_PRICING: Record<ServiceType, PricingValues> = {
  FOOD: {
    platformFee: 5,
    platformFeeOriginal: 12,
    deliveryFee: 20,
    deliveryFeeOriginal: 39,
    gstRate: 0.18,
    commissionRate: 0.1,
    packagingCharges: 0,
    packagingChargesOriginal: 8,
  },
  GROCERY: {
    platformFee: 3,
    platformFeeOriginal: 12,
    deliveryFee: 17,
    deliveryFeeOriginal: 39,
    gstRate: 0.18,
    commissionRate: 0.02,
    packagingCharges: 0,
    packagingChargesOriginal: 4,
  },
};

function configToValue(items: PricingConfigItem[], key: string): number | undefined {
  const item = items.find(i => i.configKey === key && i.isActive);
  return item?.actualValue;
}

function configToExpected(items: PricingConfigItem[], key: string): number | undefined {
  const item = items.find(i => i.configKey === key && i.isActive);
  return item?.expectedValue ?? undefined;
}

function parsePricingValues(items: PricingConfigItem[], serviceType: ServiceType): PricingValues {
  const defaults = DEFAULT_PRICING[serviceType];
  return {
    platformFee: configToValue(items, 'PLATFORM_FEE') ?? defaults.platformFee,
    platformFeeOriginal: configToExpected(items, 'PLATFORM_FEE') ?? defaults.platformFeeOriginal,
    deliveryFee: configToValue(items, 'DELIVERY_FEE') ?? defaults.deliveryFee,
    deliveryFeeOriginal: configToExpected(items, 'DELIVERY_FEE') ?? defaults.deliveryFeeOriginal,
    gstRate: (configToValue(items, 'GST') ?? defaults.gstRate * 100) / 100,
    commissionRate: (configToValue(items, 'COMMISSION') ?? defaults.commissionRate * 100) / 100,
    packagingCharges: configToValue(items, 'PACKAGING_CHARGE') ?? defaults.packagingCharges,
    packagingChargesOriginal:
      configToExpected(items, 'PACKAGING_CHARGE') ?? defaults.packagingChargesOriginal,
  };
}

const initialState = {
  configs: { FOOD: [], GROCERY: [] } as Record<ServiceType, PricingConfigItem[]>,
  loading: false,
  error: null as string | null,
  _lastFetchedAt: { FOOD: 0, GROCERY: 0 } as Record<ServiceType, number>,
};

const usePricingStore = create<PricingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchPricing: async (serviceType: ServiceType) => {
        if (
          isCacheFresh(get()._lastFetchedAt[serviceType], CACHE_TTL.PRICING) &&
          get().configs[serviceType].length > 0
        ) {
          return;
        }

        set({ loading: true, error: null });
        try {
          const items = await fetchPricingConfig(serviceType);
          set(state => ({
            configs: { ...state.configs, [serviceType]: items },
            _lastFetchedAt: { ...state._lastFetchedAt, [serviceType]: Date.now() },
            loading: false,
          }));
        } catch (err: unknown) {
          set({
            loading: false,
            error: (err as Error)?.message || 'Failed to fetch pricing config',
          });
        }
      },

      getPricingValues: (serviceType: ServiceType) => {
        const items = get().configs[serviceType];
        if (items.length === 0) {
          return DEFAULT_PRICING[serviceType];
        }
        return parsePricingValues(items, serviceType);
      },

      reset: () => set(initialState),
    }),
    createPersistedConfig<PricingStore>('pricing-storage', state => ({
      configs: state.configs,
      _lastFetchedAt: state._lastFetchedAt,
    }))
  )
);

export default usePricingStore;
