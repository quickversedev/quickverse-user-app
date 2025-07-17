import { create } from 'zustand';
import axiosInstance from '../config/api/axios.config';
import { LocationFilter, Vendor, VendorFilters, VendorStore } from '../types/vendor';

const USE_VENDOR_MOCKS = true; // Set to false for real API
const VENDOR_API_URL = '/v1/vendors'; // Adjust as needed

const MOCK_VENDORS: Vendor[] = [
  {
    shopId: '4512',
    name: 'BCRoy-713206',
    logo: 'https://www.smartbiz.in/AadharRestaurant',
    banner: 'https://i.postimg.cc/mkTrt2Y7/Aahar.jpg',
    owner: 'Aadhar Restaurant',
    phone: '7384434233',
    openingTime: '25 Mins',
    closingTime: '10:30 AM',
    preparationTime: '10:30 PM',
    description: 'Biryani, Kebabs, Chinese and more done perfectly!',
    category: 'Restaurant',
    storeEnabled: true,
    storeActive: true,
    rating: 4.3,
    shopAddress: {
      address: 'Something',
      city: 'Bangalore',
      state: 'Bangalore',
      postalCode: '560034',
    },
    coordinates: {
      longitude: 78.9,
      latitude: 34.4,
    },
  },
  {
    shopId: '4513',
    name: 'Daily Mart',
    logo: 'https://images.unsplash.com/photo-1606813902624-c8f63f1a7df0?auto=format&fit=crop&w=80&q=80',
    banner:
      'https://images.unsplash.com/photo-1610394212206-f9d23c3e5eae?auto=format&fit=crop&w=800&q=80',
    owner: 'Priya Desai',
    phone: '9876543210',
    openingTime: '07:00 AM',
    closingTime: '10:00 PM',
    preparationTime: '15 mins',
    description: 'Fresh groceries delivered to your doorstep.',
    category: 'Grocery',
    storeEnabled: true,
    storeActive: false,
    rating: 0,
    shopAddress: {
      address: 'FC Road',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411005',
    },
    coordinates: {
      longitude: 73.8567,
      latitude: 18.5204,
    },
  },
  {
    shopId: '4514',
    name: 'MediCare Pharmacy',
    logo: 'https://images.unsplash.com/photo-1588776814546-ec7d8d3c7c17?auto=format&fit=crop&w=80&q=80',
    banner:
      'https://images.unsplash.com/photo-1584362917165-6b8c43ab6597?auto=format&fit=crop&w=800&q=80',
    owner: 'Rahul Verma',
    phone: '9988776655',
    openingTime: '09:00 AM',
    closingTime: '09:00 PM',
    preparationTime: '30 mins',
    description: 'Order genuine medicines and health supplies online.',
    category: 'Pharmacy',
    storeEnabled: true,
    storeActive: true,
    rating: 4.1,
    shopAddress: {
      address: 'Near City Center',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600001',
    },
    coordinates: {
      longitude: 80.2707,
      latitude: 13.0827,
    },
  },
  {
    shopId: '4515',
    name: 'Street Bites',
    logo: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=80&q=80',
    banner:
      'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=800&q=80',
    owner: 'Sneha Reddy',
    phone: '9123456789',
    openingTime: '04:00 PM',
    closingTime: '11:00 PM',
    preparationTime: '20 mins',
    description: 'Popular local street food favorites.',
    category: 'Food',
    storeEnabled: true,
    storeActive: true,
    rating: 4.5,
    shopAddress: {
      address: 'Food Street',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500001',
    },
    coordinates: {
      longitude: 78.4867,
      latitude: 17.385,
    },
  },
  {
    shopId: '4516',
    name: 'Green Basket',
    logo: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=80&q=80',
    banner:
      'https://images.unsplash.com/photo-1586244431163-37093a2f5c96?auto=format&fit=crop&w=800&q=80',
    owner: 'Ravi Nair',
    phone: '9300088000',
    openingTime: '06:00 AM',
    closingTime: '09:00 PM',
    preparationTime: '20 mins',
    description: 'Organic and local groceries delivered fresh daily.',
    category: 'Grocery',
    storeEnabled: true,
    storeActive: false,
    rating: 3.8,
    shopAddress: {
      address: 'Organic Market',
      city: 'Kochi',
      state: 'Kerala',
      postalCode: '682001',
    },
    coordinates: {
      longitude: 76.9366,
      latitude: 8.5241,
    },
  },
  {
    shopId: '4517',
    name: 'Health Plus',
    logo: 'https://images.unsplash.com/photo-1597764691300-7ec94d9b5272?auto=format&fit=crop&w=80&q=80',
    banner:
      'https://images.unsplash.com/photo-1588776814984-f8941be7e86c?auto=format&fit=crop&w=800&q=80',
    owner: 'Meena Kulkarni',
    phone: '9887654321',
    openingTime: '08:00 AM',
    closingTime: '10:00 PM',
    preparationTime: '25 mins',
    description: 'Trusted pharmacy with express delivery.',
    category: 'Pharmacy',
    storeEnabled: true,
    storeActive: true,
    rating: 4.2,
    shopAddress: {
      address: 'Medical Center',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411001',
    },
    coordinates: {
      longitude: 73.8567,
      latitude: 18.5204,
    },
  },
];

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
        set({ vendors: MOCK_VENDORS, loading: false, userLocation: location || null });
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
        const vendor = MOCK_VENDORS.find(v => v.shopId === shopId);
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
}));

export default useVendorStore;
