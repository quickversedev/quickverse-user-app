import { ImageSourcePropType } from 'react-native';

export interface VendorAddress {
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface VendorCoordinates {
  longitude: number;
  latitude: number;
}

export interface VendorLocation {
  type: string;
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Vendor {
  shopId: string;
  name: string;
  logo: string;
  banner: ImageSourcePropType;
  owner: string;
  phone: string;
  openingTime: string;
  closingTime: string;
  preparationTime: string;
  description: string;
  category: string;
  location?: VendorLocation; // Make optional for backward compatibility
  storeEnabled: boolean;
  storeActive: boolean;
  rating?: number; // Optional rating field
  shopAddress?: VendorAddress; // Optional address field
  coordinates?: VendorCoordinates; // Optional coordinates field
  featured?: boolean; // Optional featured field
}

export interface VendorFilters {
  category?: string;
  storeActive?: boolean;
  storeEnabled?: boolean;
  searchQuery?: string;
}

export interface LocationFilter {
  latitude: number;
  longitude: number;
  radius?: number; // Default 5000m if not provided
}

export interface VendorStore {
  // State
  vendors: Vendor[];
  selectedVendor: Vendor | null;
  loading: boolean;
  error: string | null;
  filters: VendorFilters;
  userLocation: LocationFilter | null;

  // Actions
  fetchVendors: (location?: LocationFilter) => Promise<void>;
  fetchVendorById: (shopId: string) => Promise<void>;
  setVendors: (vendors: Vendor[]) => void;
  setSelectedVendor: (vendor: Vendor | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<VendorFilters>) => void;
  setUserLocation: (location: LocationFilter | null) => void;
  clearFilters: () => void;

  // Computed values
  getActiveVendors: () => Vendor[];
  getVendorsByCategory: (category: string) => Vendor[];
  getFeaturedVendors: () => Vendor[];
  getFilteredVendors: () => Vendor[];
  getVendorsNearLocation: (location: LocationFilter) => Vendor[];
  getVendorNameById: (shopId: string) => string | undefined;
  searchVendorsByQuery: (query: string) => Vendor[];
}
