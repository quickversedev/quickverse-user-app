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
  // Restaurant
  {
    shopId: '4518',
    name: 'Spice Villa',
    logo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=80&q=80',
    banner:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    owner: 'Rohit Mehra',
    phone: '9000011111',
    openingTime: '11:00 AM',
    closingTime: '11:00 PM',
    preparationTime: '35 mins',
    description: 'Authentic Indian cuisine with a modern twist.',
    category: 'Restaurant',
    storeEnabled: true,
    storeActive: true,
    rating: 4.6,
    shopAddress: {
      address: 'MG Road',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
    },
    coordinates: {
      longitude: 77.2167,
      latitude: 28.6667,
    },
  },
  // Grocery
  {
    shopId: '4519',
    name: 'SuperMart',
    logo: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=80&q=80',
    banner:
      'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=800&q=80',
    owner: 'Anjali Gupta',
    phone: '9000022222',
    openingTime: '08:00 AM',
    closingTime: '09:00 PM',
    preparationTime: '10 mins',
    description: 'Your one-stop shop for daily essentials.',
    category: 'Grocery',
    storeEnabled: true,
    storeActive: true,
    rating: 4.0,
    shopAddress: {
      address: 'Main Market',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
    },
    coordinates: {
      longitude: 72.8777,
      latitude: 19.076,
    },
  },
  // Pharmacy
  {
    shopId: '4520',
    name: 'Wellness Pharmacy',
    logo: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=80&q=80',
    banner:
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80',
    owner: 'Suresh Patil',
    phone: '9000033333',
    openingTime: '09:00 AM',
    closingTime: '10:00 PM',
    preparationTime: '20 mins',
    description: 'All medicines and health products available.',
    category: 'Pharmacy',
    storeEnabled: true,
    storeActive: true,
    rating: 4.4,
    shopAddress: {
      address: 'Health Street',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
    },
    coordinates: {
      longitude: 77.5946,
      latitude: 12.9716,
    },
  },
  // Food
  {
    shopId: '4521',
    name: 'Sweet Treats',
    logo: 'https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=80&q=80',
    banner:
      'https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=800&q=80',
    owner: 'Priya Singh',
    phone: '9000044444',
    openingTime: '10:00 AM',
    closingTime: '09:00 PM',
    preparationTime: '25 mins',
    description: 'Cakes, pastries, and more delicious desserts.',
    category: 'Food',
    storeEnabled: true,
    storeActive: true,
    rating: 4.7,
    shopAddress: {
      address: 'Baker Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600002',
    },
    coordinates: {
      longitude: 80.2785,
      latitude: 13.0878,
    },
  },
  // Add a second vendor for each category
  // Restaurant
  {
    shopId: '4522',
    name: 'Urban Tadka',
    logo: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=80&q=80',
    banner:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    owner: 'Vikram Joshi',
    phone: '9000055555',
    openingTime: '12:00 PM',
    closingTime: '11:30 PM',
    preparationTime: '40 mins',
    description: 'North Indian and Mughlai specialties.',
    category: 'Restaurant',
    storeEnabled: true,
    storeActive: true,
    rating: 4.2,
    shopAddress: {
      address: 'Sector 17',
      city: 'Chandigarh',
      state: 'Chandigarh',
      postalCode: '160017',
    },
    coordinates: {
      longitude: 76.7794,
      latitude: 30.7333,
    },
  },
  // Grocery
  {
    shopId: '4523',
    name: 'Daily Needs',
    logo: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=80&q=80',
    banner:
      'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=800&q=80',
    owner: 'Ramesh Kumar',
    phone: '9000066666',
    openingTime: '07:00 AM',
    closingTime: '10:00 PM',
    preparationTime: '12 mins',
    description: 'Groceries and daily essentials at best prices.',
    category: 'Grocery',
    storeEnabled: true,
    storeActive: true,
    rating: 4.1,
    shopAddress: {
      address: 'Market Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380001',
    },
    coordinates: {
      longitude: 72.5714,
      latitude: 23.0225,
    },
  },
  // Pharmacy
  {
    shopId: '4524',
    name: 'MediQuick',
    logo: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=80&q=80',
    banner:
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80',
    owner: 'Sunita Sharma',
    phone: '9000077777',
    openingTime: '08:00 AM',
    closingTime: '09:00 PM',
    preparationTime: '18 mins',
    description: 'Fast delivery of medicines and health products.',
    category: 'Pharmacy',
    storeEnabled: true,
    storeActive: true,
    rating: 4.3,
    shopAddress: {
      address: 'Pharma Lane',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500002',
    },
    coordinates: {
      longitude: 78.4867,
      latitude: 17.385,
    },
  },
  // Food
  {
    shopId: '4525',
    name: 'Snack Shack',
    logo: 'https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=80&q=80',
    banner:
      'https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=800&q=80',
    owner: 'Amit Patel',
    phone: '9000088888',
    openingTime: '11:00 AM',
    closingTime: '10:00 PM',
    preparationTime: '22 mins',
    description: 'Quick bites and fast food favorites.',
    category: 'Food',
    storeEnabled: true,
    storeActive: true,
    rating: 4.0,
    shopAddress: {
      address: 'Fast Food Street',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411002',
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
