import { create } from 'zustand';
import axiosInstance from '../../config/api/axios.config';
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
      const response = await axiosInstance.get('/v2/getLocalAddress', {
        headers: {
          SessionKey:
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjdXN0b21lcklkIjoiNzMwMTIzMzQzMjA4NjYiLCJ1c2VyVHlwZSI6IkNVU1RPTUVSIiwiaWF0IjoxNzU0NjYyNjc1LCJleHAiOjE3ODYxOTg2NzV9.xomsHlGlBa3dady6jvKe2cEkrJDYKpFvjh0w2Up5TAM',
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
            SessionKey:
              'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJtb2JpbGUiOiI5MTk3NjUwMDgxMTAiLCJpYXQiOjE3NTIzOTcwNTgsImV4cCI6MTc4MzkzMzA1OH0.vW0upVYdLBWCuy7Qinxgoz2a68TSdyEidjJtZDDCeaU',
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
