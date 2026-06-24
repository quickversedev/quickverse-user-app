import { create } from 'zustand';
import { mockVendors } from '../assets/mock/vendor';
import axiosInstance, { apiCall, getAuthHeader } from '../config/api/axios.config';
import { LocationFilter, Vendor, VendorFilters, VendorStore } from '../types/vendor';
import { getDistanceInKm } from '../utils/distance';
import { isStoreOpen } from '../utils/storeUtils';

// Request debouncing mechanism
let currentRequestId = 0;
let pendingRequest: AbortController | null = null;

const USE_VENDOR_MOCKS = false; // Set to false for real API
const VENDOR_API_URL = '/v3/shops'; // Adjust as needed

// Helper to extract vendor coordinates from either new or legacy shape
const getVendorCoords = (vendor: Vendor): { lat?: number; lon?: number } => {
  if (vendor.coordinates?.latitude != null && vendor.coordinates?.longitude != null) {
    return { lat: vendor.coordinates.latitude, lon: vendor.coordinates.longitude };
  }
  const legacy = vendor.location?.coordinates; // [lon, lat]
  if (legacy && legacy.length === 2) {
    return { lon: legacy[0], lat: legacy[1] };
  }
  return {};
};

// Helper function to sort vendors by store open status
const sortVendorsByActiveStatus = (vendors: Vendor[]): Vendor[] => {
  return vendors.sort((a, b) => {
    // Check if stores are actually open using store hours
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

    // Open stores first, then closed stores
    if (storeAStatus.isOpen && !storeBStatus.isOpen) return -1;
    if (!storeAStatus.isOpen && storeBStatus.isOpen) return 1;
    return 0;
  });
};

const useVendorStore = create<VendorStore>((set, get) => ({
  // Initial state
  vendors: [],
  selectedVendor: null,
  loading: false,
  error: null,
  filters: {},
  userLocation: null,

  // Actions
  fetchVendors: async (location?: LocationFilter) => {
    console.log('[VendorStore] fetchVendors called with location:', location);
    // Cancel any pending request
    if (pendingRequest) {
      console.log('[VendorStore] Aborting pending request');
      pendingRequest.abort();
    }

    // Create new request ID and abort controller
    const requestId = ++currentRequestId;
    const abortController = new AbortController();
    pendingRequest = abortController;

    set({ loading: true, error: null });

    if (USE_VENDOR_MOCKS) {
      console.log('[VendorStore] Using mocks');
      // Always return all mock vendors regardless of location
      setTimeout(() => {
        // Only update if this is still the current request
        if (requestId === currentRequestId) {
          const sortedVendors = sortVendorsByActiveStatus(mockVendors);
          console.log('[VendorStore] Mock vendors sorted:', sortedVendors.length);
          set({ vendors: sortedVendors, loading: false, userLocation: location || null });
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

      console.log('[VendorStore] Fetching from API:', VENDOR_API_URL, 'Params:', params);

      const authHeader = getAuthHeader();
      console.log('[VendorStore] Auth Header:', authHeader ? 'Present' : 'Missing');

      const data = await apiCall(
        axiosInstance.get(VENDOR_API_URL, {
          params: { ...params, isTest: false },
          headers: {
            Authorization: authHeader,
          },
          signal: abortController.signal,
        })
      );

      console.log(
        '[VendorStore] API Response data length:',
        Array.isArray(data) ? data.length : 'Not Array'
      );

      // Only update state if this is still the current request
      if (requestId === currentRequestId) {
        const sortedVendors = sortVendorsByActiveStatus(data);
        console.log('[VendorStore] Setting vendors in state:', sortedVendors.length);
        set({
          vendors: sortedVendors,
          loading: false,
          userLocation: location || null,
        });
      }
    } catch (err: unknown) {
      // Extensive error logging
      const error: any = err;
      console.error('[VendorStore] API Error Details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        endpoint: error.apiEndpoint,
        responsedata: error.response?.data || 'No data',
      });

      // Don't update state if request was aborted
      if (error.name === 'AbortError') {
        console.log('[VendorStore] Request aborted');
        return;
      }

      // Only update error state if this is still the current request
      if (requestId === currentRequestId) {
        set({ error: 'Failed to fetch vendors', loading: false });
      }
    } finally {
      // Clear pending request if this was the current one
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
    } catch (err) {
      set({ error: 'Failed to fetch vendor details', loading: false });
    }
  },

  setVendors: (vendors: Vendor[]) => {
    const loc = get().userLocation;
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

  // Computed values
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

    return vendors.filter(vendor => {
      // Use new coordinates structure if available, fallback to old location structure
      let vendorLat: number, vendorLon: number;

      if (vendor.coordinates) {
        vendorLat = vendor.coordinates.latitude;
        vendorLon = vendor.coordinates.longitude;
      } else if (vendor.location) {
        vendorLat = vendor.location.coordinates[1]; // latitude
        vendorLon = vendor.location.coordinates[0]; // longitude
      } else {
        return false; // Skip vendors without location data
      }

      const distance = getDistanceInKm(location.latitude, location.longitude, vendorLat, vendorLon);
      return distance <= radius;
    });
  },

  // New action: get vendor name by shopId
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

  // New method: search vendors by name and category
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
}));

export default useVendorStore;
