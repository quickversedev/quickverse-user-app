import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useAddress, useConfig, usePages } from '../../hooks';
import { PermissionAndLocation } from '../../hooks/Permissions/useLocation';
import { findClosestAddressWithinRadius } from '../../screens/profile/Address/utils/addressUtils';
import { getAddressFromCoordinates } from '../../services/api/olaLocationService';
import { getUserAddresses } from '../../services/localStorage/storage.service';
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
 * 1. Loading addresses from MMKV storage first
 * 2. Fetching essential data (vendors, addresses, config, theme)
 * 3. Initializing user's selected address based on various scenarios
 * 4. Managing loading and error states during initialization
 * 5. Providing retry functionality for failed initialization
 *
 * Initialization Flow:
 * - Load addresses from MMKV storage
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
  const initializationRef = useRef(false);

  // Store hooks for data fetching
  const { fetchVendors, loading: vendorLoading, error: vendorError } = useVendorStore();
  const {
    fetchAddresses,
    loading: addressLoading,
    fetchError: _addressError,
    loadAddressesFromStorage,
  } = useAddress();
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

  // Get cached addresses once
  const cachedAddresses = isLoggedIn ? getUserAddresses() : undefined;
  const hasCachedAddresses = cachedAddresses && cachedAddresses.length > 0;

  // Combined loading and error states for UI
  // Exclude addressLoading if we have cached addresses (non-blocking API call)
  const isLoading =
    vendorLoading || (!hasCachedAddresses && addressLoading) || configLoading || pagesLoading;
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

        try {
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
            tag: 'QV_Current_Location',
            addressLine1: components.formatted_address || 'Current Location',
            addressLine2: '',
            addressLine3: '',
            postalCode: components.postalCode || '',
            coordinates: {
              longitude: currentLongitude,
              latitude: currentLatitude,
            },
            isSavedAddress: false,
          };
          setSelectedAddress(currentAddress);
          return;
        } catch (geocodeError) {
          console.warn('Failed to reverse geocode current location:', geocodeError);
          // Fallback to a default address if geocoding fails
          const fallbackAddress: Address = {
            addressID: 'fallback-current-location',
            name: 'Current Location',
            phone: '',
            city: 'unknown',
            state: 'unknown',
            tag: 'QV_Current_Location',
            addressLine1: 'Current Location',
            addressLine2: '',
            addressLine3: '',
            postalCode: '',
            coordinates: {
              longitude: currentLongitude,
              latitude: currentLatitude,
            },
            isSavedAddress: false,
          };
          setSelectedAddress(fallbackAddress);
          return;
        }
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
              tag: 'QV_DEFAULT_LOCATION',
              addressLine1: components.formatted_address || 'Default Location',
              addressLine2: '',
              addressLine3: '',
              postalCode: components.postalCode || '',
              coordinates: {
                longitude: parseFloat(defaultLocation.longitude),
                latitude: parseFloat(defaultLocation.latitude),
              },
              isSavedAddress: false,
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
          isSavedAddress: false,
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

  const initializeApp = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      // Step 1: Load addresses from MMKV storage first
      if (isLoggedIn) {
        loadAddressesFromStorage();
      }
      console.log('locationData', locationData);
      // Step 2: Fetch config in parallel
      const configPromise = fetchInitialConfig({
        longitude: locationData?.location?.longitude?.toString(),
        latitude: locationData?.location?.latitude?.toString(),
      });

      // Step 3: Handle address fetching based on MMKV storage state
      const addressPromise = isLoggedIn
        ? (async () => {
            if (!cachedAddresses || cachedAddresses.length === 0) {
              // MMKV storage is empty, wait for API call to resolve
              await fetchAddresses();
            } else {
              fetchAddresses().catch(() => {
                // Silently handle API errors for non-blocking calls
              });
            }
          })()
        : Promise.resolve();

      await Promise.allSettled([configPromise, addressPromise]);
      console.log('configPromise', configPromise);
      // Step 4: Fetch theme and pages
      await Promise.allSettled([fetchTheme(), fetchPages()]);

      // Step 5: Initialize selected address
      await (async () => {
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
    cachedAddresses,
  ]);

  const handleRetry = useCallback(() => {
    initializationRef.current = false;
    initializeApp();
  }, []);

  useEffect(() => {
    initializeApp();
  }, []);
  useEffect(() => {
    if (selectedAddress?.coordinates?.latitude && selectedAddress?.coordinates?.longitude) {
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
    return <>{children}</>;
  }

  // Fallback/loading state while initializing
  return <HomeScreenSkeleton />;
};

export default AppInitializer;
