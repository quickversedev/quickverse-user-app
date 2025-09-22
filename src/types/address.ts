import { AuthSession } from '../services/localStorage/storage.service';

export type AddressDetails = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3?: string | null;
  city: string;
  state: string;
  pincode: string;
  phoneNumber: string;

  tag: string;
  latitude?: string;
  longitude?: string;
};

export type Address = {
  addressID: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  tag: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  postalCode: string;
  coordinates: {
    longitude: number;
    latitude: number;
  };
  isSavedAddress?: boolean;
};

export type NewAddress = AddressDetails & { isDefaultAddress: boolean };

export type AddressState = {
  addresses: Address[];
  loading: boolean;
  addingLoading: boolean;
  fetchError: string | null;
  addError: string | null;
};

export type AddressActions = {
  fetchAddresses: (authSession: AuthSession) => Promise<void>;
  addAddress: (
    newAddress: NewAddress,
    authSession: AuthSession
  ) => Promise<{ success: boolean; error?: any }>;
  loadAddressesFromStorage: () => Address[];
  clearAddressesFromStorage: () => void;
  setLoading: (loading: boolean) => void;
  setAddingLoading: (loading: boolean) => void;
  setFetchError: (error: string | null) => void;
  setAddError: (error: string | null) => void;
  clearFetchError: () => void;
  clearAddError: () => void;
};

export type AddressStore = AddressState & AddressActions;
