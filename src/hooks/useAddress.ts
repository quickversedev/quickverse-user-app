import { useAuth } from '../contexts/login/AuthProvider';
import { AuthSession } from '../services/localStorage/storage.service';
import useAddressStore from '../store/address/addressStore';
import { NewAddress } from '../types/address';

export const useAddress = () => {
  const { authData } = useAuth();
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
    const result = await addAddress(newAddress, authData as AuthSession);
    return result;
  };

  const retryFetch = () => {
    clearFetchError();
    if (authData) {
      fetchAddresses(authData);
    }
  };

  return {
    // State
    addresses,
    loading,
    addingLoading,
    fetchError,
    addError,

    // Actions
    fetchAddresses: () => fetchAddresses(authData as AuthSession),
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
