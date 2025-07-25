import { create } from 'zustand';
import { mockVendors } from '../assets/mock/vendor';
import axiosInstance from '../config/api/axios.config';
import { LocationFilter, Vendor, VendorFilters, VendorStore } from '../types/vendor';

const USE_VENDOR_MOCKS = true; // Set to false for real API
const VENDOR_API_URL = '/v1/vendors'; // Adjust as needed

// Helper function to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
    set({ loading: true, error: null });

    if (USE_VENDOR_MOCKS) {
      // Always return all mock vendors regardless of location
      setTimeout(() => {
        set({ vendors: mockVendors, loading: false, userLocation: location || null });
      }, 1000);
      return;
    }

    try {
      const params = location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            radiusKm: location.radiusKm || 5,
          }
        : {};

      const response = await axiosInstance.get(VENDOR_API_URL, { params });
      set({
        vendors: response.data,
        loading: false,
        userLocation: location || null,
      });
    } catch (err) {
      set({ error: 'Failed to fetch vendors', loading: false });
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
      const response = await axiosInstance.get(`${VENDOR_API_URL}/${shopId}`);
      set({ selectedVendor: response.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch vendor details', loading: false });
    }
  },

  setVendors: (vendors: Vendor[]) => set({ vendors }),
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
    return vendors.filter(vendor => vendor.storeActive && vendor.storeEnabled);
  },

  getVendorsByCategory: (category: string) => {
    const { vendors } = get();
    return vendors.filter(vendor => vendor.category === category);
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
    const radius = location.radiusKm || 5;

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

      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        vendorLat,
        vendorLon
      );
      return distance <= radius;
    });
  },

  // New action: get vendor name by shopId
  getVendorNameById: (shopId: string) => {
    const { vendors } = get();
    const vendor = vendors.find(v => v.shopId === shopId);
    return vendor ? vendor.name : undefined;
  },
}));

export default useVendorStore;
