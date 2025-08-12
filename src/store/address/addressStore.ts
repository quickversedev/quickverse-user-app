import { create } from 'zustand';
import axiosInstance, { apiCall } from '../../config/api/axios.config';
import { ApiError } from '../../config/api/axios.types';
import { AuthSession } from '../../services/localStorage/storage.service';
import { AddressStore, NewAddress } from '../../types/address';

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
      set({ loading: true, fetchError: null });
      if (!authSession?.jwt) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await axiosInstance.get('/v2/addresses', {
        headers: {
          SessionKey: authSession.jwt,
          phone: authSession.phone,
        },
      });
      set({
        addresses: response.data || [],
        loading: false,
        fetchError: null,
      });
    } catch (err) {
      console.error('Error fetching addresses:', err);
      set({
        fetchError: 'Failed to fetch addresses. Please try again.',
        loading: false,
      });
    }
  },

  addAddress: async (newAddress: NewAddress, authSession?: AuthSession) => {
    try {
      set({ addingLoading: true, addError: null });

      if (!authSession?.jwt) {
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

      // Use apiCall wrapper for proper error handling
      await apiCall(
        axiosInstance.post('/v2/addresses', addressData, {
          headers: {
            SessionKey: authSession.jwt,
            phone: '',
          },
        })
      );

      // Refresh addresses after adding
      await get().fetchAddresses();
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
