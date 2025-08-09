import useAddressStore from '../store/address/addressStore';
import { NewAddress } from '../types/address';

export const useAddress = () => {
  const { addresses, loading, error, fetchAddresses, addAddress, setError, clearError } =
    useAddressStore();

  // Auto-fetch addresses on mount
  // useEffect(() => {
  //   fetchAddresses();
  // }, [fetchAddresses]);

  const handleAddAddress = async (newAddress: NewAddress) => {
    try {
      await addAddress(newAddress);
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const retryFetch = () => {
    clearError();
  };

  return {
    // State
    addresses,
    loading,
    error,

    // Actions
    fetchAddresses,
    addAddress: handleAddAddress,
    retryFetch,
    clearError,
    setError,

    // Computed values
    hasAddresses: addresses.length > 0,
    defaultAddress: addresses.find(addr => addr.isDefault),
  };
};
