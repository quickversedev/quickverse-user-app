import useAddressStore from '../store/address/addressStore';
import { NewAddress } from '../types/address';

export const useAddress = () => {
  const {
    addresses,
    loading,
    addingLoading,
    fetchError,
    addError,
    fetchAddresses,
    addAddress,
    setFetchError,
    setAddError,
    clearFetchError,
    clearAddError,
  } = useAddressStore();

  // Auto-fetch addresses on mount
  // useEffect(() => {
  //   fetchAddresses();
  // }, [fetchAddresses]);

  const handleAddAddress = async (newAddress: NewAddress) => {
    const result = await addAddress(newAddress);
    return result;
  };

  const retryFetch = () => {
    clearFetchError();
  };

  return {
    // State
    addresses,
    loading,
    addingLoading,
    fetchError,
    addError,

    // Actions
    fetchAddresses,
    addAddress: handleAddAddress,
    retryFetch,
    clearFetchError,
    clearAddError,
    setFetchError,
    setAddError,

    // Computed values
    hasAddresses: addresses.length > 0,
    defaultAddress: addresses.find(addr => addr.tag === 'Home'), // Use tag instead of isDefault
  };
};
