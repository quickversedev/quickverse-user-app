export type AddressDetails = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3?: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  tag: string;
  latitude?: string;
  longitude?: string;
};

export type Address = {
  id: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
  // Add missing properties to match AddressDetails
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  pincode?: string;
  tag?: string;
  landmark?: string;
  latitude?: string;
  longitude?: string;
};

export type NewAddress = AddressDetails & { isDefaultAddress?: boolean };

export type AddressState = {
  addresses: Address[];
  loading: boolean;
  error: string | null;
};

export type AddressActions = {
  fetchAddresses: () => Promise<void>;
  addAddress: (newAddress: NewAddress) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
};

export type AddressStore = AddressState & AddressActions;
