import { create } from 'zustand';
import axiosInstance, { apiCall } from '../../config/api/axios.config';
import { ApiError } from '../../config/api/axios.types';
import {
  AuthSession,
  getUserAddresses,
  removeUserAddresses,
  setUserAddresses,
} from '../../services/localStorage/storage.service';
import { Address, AddressStore, NewAddress } from '../../types/address';

const useAddressStore = create<AddressStore>((set, get) => ({
  // Initial state
  addresses: [],
  loading: false, // This is for fetch operations (used by AppInitializer)
  addingLoading: false, // This is for add operations (not used by AppInitializer)
  fetchError: null, // Error for fetch operations
  addError: null, // Error for add operations

  // Actions
  setLoading: (loading: boolean) => set({ loading }),
  setAddingLoading: (loading: boolean) => set({ addingLoading: loading }),
  setFetchError: (error: string | null) => set({ fetchError: error }),
  setAddError: (error: string | null) => set({ addError: error }),
  clearFetchError: () => set({ fetchError: null }),
  clearAddError: () => set({ addError: null }),

  fetchAddresses: async (authSession?: AuthSession) => {
    try {
      console.log('[AddressStore] fetchAddresses called');
      set({ loading: true, fetchError: null });
      if (!authSession?.jwt) {
        console.error('[AddressStore] fetchAddresses - No auth session');
        throw new Error('Authentication required. Please login again.');
      }
      const response = await axiosInstance.get('/v2/addresses', {
        headers: {
          SessionKey: authSession.jwt,
          phone: authSession.phone,
        },
      });
      const addresses = response.data || [];

      console.log('[AddressStore] fetchAddresses - API returned:', addresses.length, 'addresses');

      // Add isSavedAddress: true to each address
      const addressesWithSavedFlag = addresses.map((address: Address) => ({
        ...address,
        isSavedAddress: true,
      }));

      // Store addresses in MMKV storage
      setUserAddresses(addressesWithSavedFlag);

      set({
        addresses: addressesWithSavedFlag,
        loading: false,
        fetchError: null,
      });

      console.log('[AddressStore] fetchAddresses - Store updated with', addressesWithSavedFlag.length, 'addresses');
    } catch (err) {
      console.error('[AddressStore] Error fetching addresses:', err);
      set({
        fetchError: 'Failed to fetch addresses. Please try again.',
        loading: false,
      });
    }
  },

  // Load addresses from MMKV storage
  loadAddressesFromStorage: () => {
    try {
      const storedAddresses = getUserAddresses();
      if (storedAddresses) {
        set({ addresses: storedAddresses });
        return storedAddresses;
      }
      return [];
    } catch (err) {
      console.error('Error loading addresses from storage:', err);
      return [];
    }
  },

  // Clear addresses from MMKV storage
  clearAddressesFromStorage: () => {
    try {
      removeUserAddresses();
      set({ addresses: [] });
    } catch (err) {
      console.error('Error clearing addresses from storage:', err);
    }
  },

  addAddress: async (newAddress: NewAddress, authSession?: AuthSession) => {
    try {
      set({ addingLoading: true, addError: null });

      if (!authSession?.jwt) {
        console.error('[AddressStore] No auth session');
        throw new Error('Authentication required. Please login again.');
      }

      // Prepare the address data according to new API format
      const addressData = {
        name: newAddress.name,
        phone: newAddress.phoneNumber,
        city: newAddress.city,
        state: newAddress.state,
        tag: newAddress.tag,
        addressLine1: newAddress.addressLine1,
        addressLine2: newAddress.addressLine2,
        addressLine3: newAddress.addressLine3 || '',
        longitude: newAddress.longitude && parseFloat(newAddress.longitude),
        latitude: newAddress.latitude && parseFloat(newAddress.latitude),
        postalCode: newAddress.pincode,
        isDefaultAddress: !!newAddress.isDefaultAddress,
      };

      console.log('[AddressStore] Saving address:', addressData);

      // Use apiCall wrapper for proper error handling
      const response = await apiCall(
        axiosInstance.post('/v2/addresses', addressData, {
          headers: {
            SessionKey: authSession.jwt,
            phone: authSession.phone,
          },
        })
      );

      console.log('[AddressStore] Address saved, response:', response);

      // Refresh addresses after adding
      console.log('[AddressStore] Fetching addresses after save...');
      await get().fetchAddresses(authSession);

      console.log('[AddressStore] Addresses after refresh:', get().addresses.length);
      set({ addingLoading: false });

      return { success: true };
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error adding address:', apiError);

      set({
        addError: apiError.message || 'Failed to add address. Please try again.',
        addingLoading: false,
      });

      // Return error object with success: false and the error details
      return {
        success: false,
        error: apiError,
      };
    }
  },
}));

export default useAddressStore;
