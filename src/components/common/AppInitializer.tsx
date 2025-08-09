import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useAddress } from '../../hooks';
import { useLocation } from '../../hooks/Permissions/useLocation';
import TabNavigation from '../../navigation/TabNavigation';
import { findClosestAddressWithinRadius } from '../../screens/profile/Address/utils/addressUtils';
import { getAddressFromCoordinates } from '../../services/api/olaLocationService';
import useAddressStore from '../../store/address/addressStore';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import type { Address } from '../../types/address';
import ErrorState from './ErrorState';

interface AppInitializerProps {
  children?: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const { getColor } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);
  const { location, getCurrentLocation, isGranted } = useLocation();
  // Store hooks
  const { fetchVendors, loading: vendorLoading, error: vendorError } = useVendorStore();

  const { fetchAddresses, loading: addressLoading, error: addressError } = useAddress();
  const { setSelectedAddress, selectedAddress, authData } = useAuth();
  const isLoggedIn = Boolean(authData?.jwt);

  // Combined loading state
  const isLoading = vendorLoading || addressLoading;

  // Combined error state
  const error = vendorError || addressError;

  const initializeApp = useCallback(async () => {
    try {
      // Build promises conditionally based on login status
      const tasks: Array<Promise<unknown>> = [
        fetchVendors().catch(vendorErr => {
          console.warn('Vendor fetch failed:', vendorErr);
          return null; // Allow fallback to mock data
        }),
      ];

      if (isLoggedIn) {
        tasks.unshift(
          fetchAddresses().catch(addrErr => {
            console.warn('Address fetch failed:', addrErr);
            return null; // Allow fallback to empty addresses
          })
        );
      }

      await Promise.allSettled(tasks);

      setIsInitialized(true);
    } catch (initErr: unknown) {
      console.error('App initialization failed:', initErr);
      // Error will be handled by the store states
    }
  }, [fetchAddresses, fetchVendors, isLoggedIn]);

  const initializeSelectedAddress = useCallback(async (): Promise<void> => {
    try {
      if (selectedAddress) return; // Do not override if already selected

      const addresses: Address[] = useAddressStore.getState().addresses as unknown as Address[];

      if (isGranted && location?.latitude && location?.longitude) {
        // Case 1: Permission granted → try closest saved address
        if (addresses && addresses.length > 0) {
          const closest = findClosestAddressWithinRadius(
            { latitude: location.latitude, longitude: location.longitude },
            addresses as unknown as Array<{ [key: string]: unknown }>,
            200
          );
          if (closest?.address) {
            setSelectedAddress(closest.address as unknown as Address);
            return;
          }
        }

        // Case 2: Permission granted but no close/saved address → reverse geocode current location
        const components = await getAddressFromCoordinates({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        const currentAddress: Address = {
          id: 'current-location',
          address: components.formatted_address || 'Current Location',
          city: components.city || '',
          state: components.state || '',
          postalCode: components.postalCode || '',
          country: components.country || '',
          isDefault: true,
        };
        setSelectedAddress(currentAddress);
        return;
      }

      // Case 3: Permission not granted and no saved addresses → set a default location
      if (!isGranted) {
        const addressesLen = addresses?.length ?? 0;
        if (addressesLen === 0) {
          const defaultAddress: Address = {
            id: 'default-location',
            address: 'Connaught Place',
            city: 'New Delhi',
            state: 'Delhi',
            postalCode: '110001',
            country: 'India',
            isDefault: true,
          };
          setSelectedAddress(defaultAddress);
        }
      }
    } catch (e) {
      // Fail silently; selected address remains unset
    }
  }, [isGranted, location?.latitude, location?.longitude, selectedAddress, setSelectedAddress]);

  const handleRetry = () => {
    setIsInitialized(false);
    initializeApp();
  };

  useEffect(() => {
    if (!isInitialized) {
      getCurrentLocation();
      initializeApp().then(() => initializeSelectedAddress());
    }
  }, [isInitialized, getCurrentLocation, initializeApp, initializeSelectedAddress]);

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: getColor('background') }]}>
        <ActivityIndicator size="large" color={getColor('primary')} />
      </View>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <ErrorState
        onRetry={handleRetry}
        title="App Initialization Failed"
        message="We couldn't load the necessary app data. Please check your internet connection and try again."
      />
    );
  }

  // Show main app if initialization successful
  if (isInitialized) {
    return children || <TabNavigation />;
  }

  // Fallback loading state
  return (
    <View style={[styles.container, { backgroundColor: getColor('background') }]}>
      <ActivityIndicator size="large" color={getColor('primary')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppInitializer;
