import { useCallback, useMemo } from 'react';
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
    loadAddressesFromStorage,
    setFetchError,
    setAddError,
    clearFetchError,
    clearAddError,
  } = useAddressStore();

  // Auto-fetch addresses on mount
  // useEffect(() => {
  //   fetchAddresses();
  // }, [fetchAddresses]);

  const handleAddAddress = useCallback(
    async (newAddress: NewAddress) => {
      const result = await addAddress(newAddress, authData as AuthSession);
      return result;
    },
    [addAddress, authData]
  );

  const retryFetch = useCallback(() => {
    clearFetchError();
    if (authData) {
      fetchAddresses(authData);
    }
  }, [authData, clearFetchError, fetchAddresses]);

  const stableFetchAddresses = useCallback(() => {
    return fetchAddresses(authData as AuthSession);
  }, [authData, fetchAddresses]);

  return useMemo(
    () => ({
      // State
      addresses,
      loading,
      addingLoading,
      fetchError,
      addError,

      // Actions
      fetchAddresses: stableFetchAddresses,
      addAddress: handleAddAddress,
      retryFetch,
      clearFetchError,
      clearAddError,
      setFetchError,
      setAddError,
      loadAddressesFromStorage,
      // Computed values
      hasAddresses: addresses.length > 0,
      defaultAddress: addresses.find(addr => addr.tag === 'Home'), // Use tag instead of isDefault
    }),
    [
      addresses,
      loading,
      addingLoading,
      fetchError,
      addError,
      stableFetchAddresses,
      handleAddAddress,
      retryFetch,
      clearFetchError,
      clearAddError,
      setFetchError,
      setAddError,
      loadAddressesFromStorage,
    ]
  );
};
