import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockVendors } from '../assets/mock/vendor';
import axiosInstance, { apiCall, getAuthHeader } from '../config/api/axios.config';
import { LocationFilter, Vendor, VendorFilters, VendorStore } from '../types/vendor';
import { isStoreOpen } from '../utils/storeUtils';
import { CACHE_TTL, createPersistedConfig, isCacheFresh } from '../utils/cache';

let currentRequestId = 0;
let pendingRequest: AbortController | null = null;

const USE_VENDOR_MOCKS = false;
const VENDOR_API_URL = '/v3/shops';

const sortVendorsByActiveStatus = (vendors: Vendor[]): Vendor[] => {
  return vendors.sort((a, b) => {
    const storeAStatus = isStoreOpen({
      openingTime: a.openingTime,
      closingTime: a.closingTime,
      storeActive: a.storeActive,
    });
    const storeBStatus = isStoreOpen({
      openingTime: b.openingTime,
      closingTime: b.closingTime,
      storeActive: b.storeActive,
    });

    if (storeAStatus.isOpen && !storeBStatus.isOpen) return -1;
    if (!storeAStatus.isOpen && storeBStatus.isOpen) return 1;
    return 0;
  });
};

interface VendorStoreWithCache extends VendorStore {
  _lastFetchedAt: number;
  invalidateCache: () => void;
  reset: () => void;
}

const initialState = {
  vendors: [] as Vendor[],
  selectedVendor: null as Vendor | null,
  loading: false,
  error: null as string | null,
  filters: {} as Partial<VendorFilters>,
  userLocation: null as LocationFilter | null,
  _lastFetchedAt: 0,
};

const useVendorStore = create<VendorStoreWithCache>()(
  persist(
    (set, get) => ({
      ...initialState,

      invalidateCache: () => set({ _lastFetchedAt: 0 }),

      fetchVendors: async (location?: LocationFilter) => {
        if (isCacheFresh(get()._lastFetchedAt, CACHE_TTL.VENDORS) && get().vendors.length > 0) {
          return;
        }

        if (pendingRequest) {
          pendingRequest.abort();
        }

        const requestId = ++currentRequestId;
        const abortController = new AbortController();
        pendingRequest = abortController;

        set({ loading: true, error: null });

        if (USE_VENDOR_MOCKS) {
          setTimeout(() => {
            if (requestId === currentRequestId) {
              const sortedVendors = sortVendorsByActiveStatus(mockVendors);
              set({
                vendors: sortedVendors,
                loading: false,
                userLocation: location || null,
                _lastFetchedAt: Date.now(),
              });
            }
          }, 1000);
          return;
        }

        try {
          const params = location
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
                radius: location.radius || 4000,
              }
            : {};

          const authHeader = getAuthHeader();
          const data = await apiCall(
            axiosInstance.get(VENDOR_API_URL, {
              params: { ...params, isTest: true, useDisplayOrder: true },
              headers: {
                Authorization: authHeader,
              },
              signal: abortController.signal,
            })
          );

          if (requestId === currentRequestId) {
            const sortedVendors = sortVendorsByActiveStatus(data);
            set({
              vendors: sortedVendors,
              loading: false,
              userLocation: location || null,
              _lastFetchedAt: Date.now(),
            });
          }
        } catch (err: unknown) {
          const error: any = err;

          // Silently ignore cancelled requests (user navigated away)
          if (error.isCancelled || error.code === 'CANCELLED' || error.name === 'AbortError') {
            return;
          }

          if (requestId === currentRequestId) {
            set({ error: 'Failed to fetch vendors', loading: false });
          }
        } finally {
          if (requestId === currentRequestId) {
            pendingRequest = null;
          }
        }
      },

      fetchVendorById: async (shopId: string) => {
        set({ loading: true, error: null });

        if (USE_VENDOR_MOCKS) {
          setTimeout(() => {
            const vendor = mockVendors.find((v: Vendor) => v.shopId === shopId);
            if (vendor) {
              set({ selectedVendor: vendor, loading: false });
            } else {
              set({ error: 'Vendor not found', loading: false });
            }
          }, 500);
          return;
        }

        try {
          const authHeader = getAuthHeader();
          const data = await apiCall(
            axiosInstance.get(`${VENDOR_API_URL}/${shopId}`, {
              headers: {
                Authorization: authHeader,
              },
            })
          );
          set({ selectedVendor: data, loading: false });
        } catch (_err) {
          set({ error: 'Failed to fetch vendor details', loading: false });
        }
      },

      setVendors: (vendors: Vendor[]) => {
        const sorted = sortVendorsByActiveStatus(vendors);
        set({ vendors: sorted });
      },
      setSelectedVendor: (vendor: Vendor | null) => set({ selectedVendor: vendor }),
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),

      setFilters: (filters: Partial<VendorFilters>) =>
        set(state => ({ filters: { ...state.filters, ...filters } })),

      setUserLocation: (location: LocationFilter | null) => set({ userLocation: location }),

      clearFilters: () => set({ filters: {} }),

      getActiveVendors: () => {
        const { vendors } = get();
        return vendors.filter(vendor => {
          const storeStatus = isStoreOpen({
            openingTime: vendor.openingTime,
            closingTime: vendor.closingTime,
            storeActive: vendor.storeActive,
          });
          return storeStatus.isOpen && vendor.storeEnabled;
        });
      },

      getVendorsByCategory: (category: string) => {
        const { vendors } = get();
        return vendors.filter(vendor => vendor.category === category);
      },

      getFeaturedVendors: () => {
        const { vendors } = get();
        return vendors.filter(vendor => vendor.featured === true);
      },

      getFilteredVendors: () => {
        const { vendors, filters } = get();
        let filtered = vendors;

        if (filters.category) {
          filtered = filtered.filter(v => v.category === filters.category);
        }

        if (filters.storeActive !== undefined) {
          filtered = filtered.filter(v => v.storeActive === filters.storeActive);
        }

        if (filters.storeEnabled !== undefined) {
          filtered = filtered.filter(v => v.storeEnabled === filters.storeEnabled);
        }

        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          filtered = filtered.filter(
            v =>
              v.name.toLowerCase().includes(query) ||
              v.description.toLowerCase().includes(query) ||
              v.owner.toLowerCase().includes(query)
          );
        }

        return filtered;
      },

      getVendorsNearLocation: (location: LocationFilter) => {
        const { vendors } = get();
        const radius = location.radius || 5;
        const { getDistanceInKm } = require('../utils/distance');

        return vendors.filter(vendor => {
          let vendorLat: number, vendorLon: number;

          if (vendor.coordinates) {
            vendorLat = vendor.coordinates.latitude;
            vendorLon = vendor.coordinates.longitude;
          } else if (vendor.location) {
            vendorLat = vendor.location.coordinates[1];
            vendorLon = vendor.location.coordinates[0];
          } else {
            return false;
          }

          const distance = getDistanceInKm(
            location.latitude,
            location.longitude,
            vendorLat,
            vendorLon
          );
          return distance <= radius;
        });
      },

      getVendorNameById: (shopId: string) => {
        const { vendors } = get();
        const vendor = vendors.find(v => v.shopId === shopId);
        return vendor ? vendor.name : undefined;
      },

      getVendorById: (shopId: string) => {
        const { vendors } = get();
        const vendor = vendors.find(v => v.shopId === shopId);
        return vendor || null;
      },

      searchVendorsByQuery: (query: string) => {
        const { vendors } = get();
        if (!query.trim()) return [];

        const searchQuery = query.toLowerCase().trim();
        return vendors.filter(vendor => {
          const nameMatch = vendor.name.toLowerCase().includes(searchQuery);
          const categoryMatch = vendor.category.toLowerCase().includes(searchQuery);
          const descriptionMatch = vendor.description.toLowerCase().includes(searchQuery);

          return nameMatch || categoryMatch || descriptionMatch;
        });
      },

      reset: () => set(initialState),
    }),
    createPersistedConfig<VendorStoreWithCache>('vendor-storage', state => ({
      vendors: state.vendors,
      userLocation: state.userLocation,
      _lastFetchedAt: state._lastFetchedAt,
    }))
  )
);

export default useVendorStore;
