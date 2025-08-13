import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useAddress, useConfig, usePages } from '../../hooks';
import { PermissionAndLocation } from '../../hooks/Permissions/useLocation';
import TabNavigation from '../../navigation/TabNavigation';
import { findClosestAddressWithinRadius } from '../../screens/profile/Address/utils/addressUtils';
import { getAddressFromCoordinates } from '../../services/api/olaLocationService';
import useAddressStore from '../../store/address/addressStore';
import useThemeStore from '../../store/themeStore';
import useVendorStore from '../../store/vendorStore';
import { Address } from '../../types/address';
import ErrorState from './ErrorState';
import { HomeScreenSkeleton } from './skeleton';

/**
 * Props for the AppInitializer component
 */
interface AppInitializerProps {
  /** Optional children to render after initialization is complete */
  locationData: PermissionAndLocation | null;
  children?: React.ReactNode;
}

/**
 * AppInitializer Component
 *
 * This component is responsible for bootstrapping the application by:
 * 1. Fetching essential data (vendors, addresses, config, theme)
 * 2. Initializing user's selected address based on various scenarios
 * 3. Managing loading and error states during initialization
 * 4. Providing retry functionality for failed initialization
 *
 * Initialization Flow:
 * - Parallel API calls for vendors, addresses (if logged in), config, and theme
 * - Address selection based on location permissions and saved addresses
 * - Graceful fallbacks for each service failure
 *
 * Address Selection Priority:
 * 1. Existing selected address (don't override)
 * 2. Closest saved address within 200m of current location
 * 3. Reverse geocoded current location
 * 4. Default address from auth data (using defaultAddressId)
 * 5. First saved address (if no defaultAddressId)
 * 6. Config default location (reverse geocoded)
 * 7. Hardcoded fallback (Connaught Place, Delhi)
 */
const AppInitializer: React.FC<AppInitializerProps> = ({ children, locationData }) => {
  // UI state
  const [isInitialized, setIsInitialized] = useState(false);
  // console.log('AppInitializer locationData', locationData);
  // Location services

  // console.log('AppInitializer location', location);
  // Store hooks for data fetching
  const { fetchVendors, loading: vendorLoading, error: vendorError } = useVendorStore();
  const { fetchAddresses, loading: addressLoading, fetchError: _addressError } = useAddress();
  const {
    fetchInitialConfig,
    loading: configLoading,
    error: _configError,
    getDefaultLocation,
  } = useConfig();
  const { fetchTheme } = useThemeStore();
  const { fetchPages, loading: pagesLoading } = usePages();

  // Authentication and address selection
  const { setSelectedAddress, selectedAddress, authData } = useAuth();
  const isLoggedIn = Boolean(authData?.jwt);

  // Combined loading and error states for UI
  const isLoading = vendorLoading || addressLoading || configLoading || pagesLoading;
  const error = vendorError;
  const { longitude: currentLongitude, latitude: currentLatitude } = locationData?.location || {};
  const permissionStatus = locationData?.permission;
  const initializeSelectedAddress = useCallback(async (): Promise<void> => {
    try {
      if (selectedAddress) {
        return;
      }
      const addresses: Address[] = useAddressStore.getState().addresses as unknown as Address[];
      if (permissionStatus === 'granted' && currentLatitude && currentLongitude) {
        if (addresses && addresses.length > 0) {
          const closest = findClosestAddressWithinRadius(
            {
              latitude: currentLatitude,
              longitude: currentLongitude,
            },
            addresses as unknown as Array<{ [key: string]: unknown }>,
            200
          );
          if (closest?.address) {
            setSelectedAddress(closest.address as unknown as Address);
            return;
          }
        }
        const components = await getAddressFromCoordinates({
          latitude: currentLatitude,
          longitude: currentLongitude,
        });
        const currentAddress: Address = {
          addressID: 'current-location',
          name: components.postalCode,
          phone: '',
          city: components.city || '',
          state: components.state || '',
          tag: 'Home',
          addressLine1: components.formatted_address || 'Current Location',
          addressLine2: '',
          addressLine3: '',
          postalCode: components.postalCode || '',
          coordinates: {
            longitude: currentLongitude,
            latitude: currentLatitude,
          },
        };
        setSelectedAddress(currentAddress);
        return;
      } else if (
        (!permissionStatus || permissionStatus !== 'granted') &&
        addresses &&
        addresses.length > 0
      ) {
        if (authData?.defaultAddressId) {
          const defaultAddress = addresses.find(
            addr => addr.addressID === authData.defaultAddressId
          );
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
            return;
          }
        }
        setSelectedAddress(addresses[0]);
        return;
      } else if (
        (!permissionStatus || permissionStatus !== 'granted') &&
        (!addresses || addresses.length === 0)
      ) {
        const defaultLocation = getDefaultLocation();
        if (defaultLocation) {
          try {
            const components = await getAddressFromCoordinates({
              latitude: parseFloat(defaultLocation.latitude),
              longitude: parseFloat(defaultLocation.longitude),
            });
            const configAddress: Address = {
              addressID: 'config-default-location',
              name: 'Default Location',
              phone: '',
              city: components.city || '',
              state: components.state || '',
              tag: 'Home',
              addressLine1: components.formatted_address || 'Default Location',
              addressLine2: '',
              addressLine3: '',
              postalCode: components.postalCode || '',
              coordinates: {
                longitude: parseFloat(defaultLocation.longitude),
                latitude: parseFloat(defaultLocation.latitude),
              },
            };
            setSelectedAddress(configAddress);
            return;
          } catch (geocodeError) {
            console.warn('Failed to reverse geocode default location:', geocodeError);
          }
        }
        const fallbackAddress: Address = {
          addressID: 'fallback-default-location',
          name: 'Connaught Place',
          phone: '',
          city: 'New Delhi',
          state: 'Delhi',
          tag: 'Home',
          addressLine1: 'Connaught Place',
          addressLine2: '',
          addressLine3: '',
          postalCode: '110001',
          coordinates: {
            longitude: 77.209,
            latitude: 28.6139,
          },
        };
        setSelectedAddress(fallbackAddress);
      } else if (permissionStatus === 'granted' && (!currentLatitude || !currentLongitude)) {
        console.warn('Location permission granted but coordinates not available');
      } else {
        console.warn('Unexpected state in address initialization:', {
          permissionStatus,
          hasLocation: Boolean(currentLatitude && currentLongitude),
          hasAddresses: Boolean(addresses && addresses.length > 0),
        });
      }
    } catch (e) {
      console.warn('Address initialization failed:', e);
    }
  }, [
    selectedAddress,
    permissionStatus,
    currentLatitude,
    currentLongitude,
    setSelectedAddress,
    authData?.defaultAddressId,
    getDefaultLocation,
  ]);
  console.log('AppInitializer initializeSelectedAddress', vendorError);

  const initializeApp = useCallback(async () => {
    try {
      const configPromise = fetchInitialConfig({
        longitude: locationData?.location?.longitude?.toString(),
        latitude: locationData?.location?.latitude?.toString(),
      });
      const addressPromise = isLoggedIn ? fetchAddresses() : Promise.resolve();

      await Promise.allSettled([configPromise, addressPromise]);

      await Promise.allSettled([fetchTheme(), fetchPages()]);

      await (async () => {
        // Inline invoke to avoid using before declaration lint issue
        await initializeSelectedAddress();
      })();
    } catch (e) {
      // Silent catch; UI handles error states from stores
    }
  }, [
    fetchInitialConfig,
    fetchAddresses,
    fetchTheme,
    fetchPages,
    initializeSelectedAddress,
    isLoggedIn,
    locationData?.location?.latitude,
    locationData?.location?.longitude,
  ]);

  const handleRetry = useCallback(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    console.log('AppInitializer useEffect');
    initializeApp();
  }, []);
  useEffect(() => {
    if (selectedAddress?.coordinates?.latitude && selectedAddress?.coordinates?.longitude) {
      console.log('AppInitializer useEffect fetchVendors', selectedAddress);
      fetchVendors(selectedAddress.coordinates).then(() => {
        setIsInitialized(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddress?.coordinates?.latitude, selectedAddress?.coordinates?.longitude]);

  // Show skeleton loader during initialization
  if (isLoading) {
    return <HomeScreenSkeleton />;
  }

  // Show error state with retry option if initialization failed
  if (error) {
    return (
      <ErrorState
        onRetry={handleRetry}
        title="App Initialization Failed"
        message="We couldn't load the necessary app data. Please check your internet connection and try again."
      />
    );
  }

  // Show main app content if initialization successful
  if (isInitialized) {
    return children || <TabNavigation />;
  }

  // Fallback/loading state while initializing
  return <HomeScreenSkeleton />;
};

export default AppInitializer;
