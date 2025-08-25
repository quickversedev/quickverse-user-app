import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axiosInstance, { apiCall } from '../../config/api/axios.config';

export interface SmartBizAddress {
  id: string;
  address: {
    name: string;
    addressLine1: string;
    addressLine2: string | null;
    addressLine3: string | null;
    city: string;
    state: string;
    pincode: string;
    latitude: string;
    longitude: string;
    tag: string | null;
    amazonAddressId: string | null;
    addressQualityScore: number | null;
  };
  isDefaultAddress: boolean;
}

export interface SmartBizAddressResponse {
  defaultAddressId: string;
  addresses: SmartBizAddress[];
}

interface SmartBizAddressState {
  addresses: SmartBizAddress[];
  defaultAddressId: string | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchAddresses: (vendorId: string, sessionKey: string, phone: string) => Promise<void>;
  setAddresses: (addresses: SmartBizAddress[], defaultAddressId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;

  // Computed
  getDefaultAddress: () => SmartBizAddress | null;
  getAddressById: (id: string) => SmartBizAddress | null;
  getAddressesByTag: (tag: string) => SmartBizAddress[];
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useSmartBizAddressStore = create<SmartBizAddressState>()(
  devtools(
    (set, get) => ({
      addresses: [],
      defaultAddressId: null,
      loading: false,
      error: null,
      lastFetched: null,

      fetchAddresses: async (vendorId: string, sessionKey: string, phone: string) => {
        const state = get();
        const now = Date.now();

        // Check if we have recent data
        if (
          state.lastFetched &&
          now - state.lastFetched < CACHE_DURATION &&
          state.addresses.length > 0
        ) {
          return;
        }

        set({ loading: true, error: null });
        console.log('fetching addresse s from smart biz');
        try {
          const data: SmartBizAddressResponse = await apiCall(
            axiosInstance.get(`/v2/listAddresses?shopId=${vendorId}`, {
              headers: {
                SessionKey: sessionKey,
                phone: phone,
              },
            })
          );
          console.log('smart biz address data', data);
          set({
            addresses: data.addresses,
            defaultAddressId: data.defaultAddressId,
            loading: false,
            error: null,
            lastFetched: now,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch addresses';
          set({
            loading: false,
            error: errorMessage,
          });
        }
      },

      setAddresses: (addresses: SmartBizAddress[], defaultAddressId: string) => {
        set({
          addresses,
          defaultAddressId,
          lastFetched: Date.now(),
        });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          addresses: [],
          defaultAddressId: null,
          loading: false,
          error: null,
          lastFetched: null,
        });
      },

      // Computed getters
      getDefaultAddress: () => {
        const state = get();
        if (!state.defaultAddressId) return null;
        return state.addresses.find(addr => addr.id === state.defaultAddressId) || null;
      },

      getAddressById: (id: string) => {
        const state = get();
        return state.addresses.find(addr => addr.id === id) || null;
      },

      getAddressesByTag: (tag: string) => {
        const state = get();
        return state.addresses.filter(addr => addr.address.tag === tag);
      },
    }),
    {
      name: 'smart-biz-address-store',
    }
  )
);
