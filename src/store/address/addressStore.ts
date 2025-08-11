import { create } from 'zustand';
import axiosInstance from '../../config/api/axios.config';
import { getAuthSession } from '../../services/localStorage/storage.service';
import { AddressStore, NewAddress } from '../../types/address';

const useAddressStore = create<AddressStore>((set, get) => ({
  // Initial state
  addresses: [],
  loading: false,
  error: null,

  // Actions
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),

  fetchAddresses: async () => {
    try {
      set({ loading: true, error: null });

      // Get auth data from storage
      const authSession = getAuthSession();
      if (!authSession?.jwt || !authSession?.phone) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await axiosInstance.get('/v2/getLocalAddress', {
        headers: {
          SessionKey: authSession.jwt,
          phone: authSession.phone,
        },
      });
      console.log('response', response.data);
      set({
        addresses: response.data || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching addresses:', err);
      set({
        error: 'Failed to fetch addresses. Please try again.',
        loading: false,
      });
    }
  },

  addAddress: async (newAddress: NewAddress) => {
    try {
      set({ loading: true, error: null });
      const { addresses } = get();

      // Get auth data from storage
      const authSession = getAuthSession();
      if (!authSession?.jwt) {
        throw new Error('Authentication required. Please login again.');
      }

      // Prepare the address data according to API format
      const addressData = {
        name: newAddress.name,
        addressLine1: newAddress.addressLine1,
        addressLine2: newAddress.addressLine2,
        addressLine3: newAddress.addressLine3 || null,
        city: newAddress.city,
        state: newAddress.state,
        pincode: newAddress.pincode,
        latitude: newAddress.latitude || null,
        longitude: newAddress.longitude || null,
        tag: newAddress.tag,
      };

      await axiosInstance.post(
        '/v2/addAddress',
        {
          address: addressData,
          isDefaultAddress: newAddress.isDefaultAddress ?? addresses.length === 0,
        },
        {
          headers: {
            SessionKey: authSession.jwt,
          },
        }
      );

      // Refresh addresses after adding
      await get().fetchAddresses();
    } catch (err) {
      console.error('Error adding address:', err);
      set({
        error: 'Failed to add address. Please try again.',
        loading: false,
      });
    }
  },
}));

export default useAddressStore;
