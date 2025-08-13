import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useAddress, useConfig, usePages } from '../../hooks';
import { useLocation } from '../../hooks/Permissions/useLocation';
import TabNavigation from '../../navigation/TabNavigation';
import { findClosestAddressWithinRadius } from '../../screens/profile/Address/utils/addressUtils';
import { getAddressFromCoordinates } from '../../services/api/olaLocationService';
import useAddressStore from '../../store/address/addressStore';
import useConfigStore from '../../store/configStore';
import useThemeStore from '../../store/themeStore';
import useVendorStore from '../../store/vendorStore';
import type { Address } from '../../types/address';
import ErrorState from './ErrorState';
import { HomeScreenSkeleton } from './skeleton';

/**
 * Props for the AppInitializer component
 */
interface AppInitializerProps {
  /** Optional children to render after initialization is complete */
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
const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  // UI state
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  // Location services
  const { location, getPermissionAndLocation } = useLocation();
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

  /**
   * Main initialization function that fetches all required data
   * Executes API calls in parallel with proper error handling
   * @param skipAddressFetch - If true, skips fetching addresses (used when selectedAddress changes)
   */
  const initializeApp = useCallback(
    async (skipAddressFetch = false) => {
      console.log('🔍 [initializeApp] location', location, selectedAddress);
      try {
        // Build an array of promises for parallel execution
        const tasks: Array<Promise<unknown>> = [
          // Always fetch vendors with location data if available
          fetchVendors(
            selectedAddress?.coordinates?.latitude && selectedAddress?.coordinates?.longitude
              ? {
                  latitude: selectedAddress.coordinates.latitude,
                  longitude: selectedAddress.coordinates.longitude,
                  radius: 5000, // Default 5km radius for vendor search
                }
              : undefined
          ).catch(vendorErr => {
            console.warn('Vendor fetch failed:', vendorErr);
            return null; // Allow fallback to mock data
          }),
        ];

        // Fetch addresses only if user is logged in AND not skipping address fetch
        if (isLoggedIn && !skipAddressFetch) {
          tasks.unshift(
            fetchAddresses().catch(addrErr => {
              console.warn('Address fetch failed:', addrErr);
              return null; // Allow fallback to empty addresses
            })
          );
        }

        // Always fetch initial config, theme, and pages (with location if available)
        tasks.unshift(
          fetchInitialConfig({
            longitude: location?.longitude?.toString(),
            latitude: location?.latitude?.toString(),
          })
            .catch(configErr => {
              console.warn('Initial config fetch failed:', configErr);
              return null; // Allow fallback to default config
            })
            .finally(() => {
              // Always fetch theme and pages in parallel regardless of config fetch success/failure
              const regionId = useConfigStore.getState().getRegionId();

              return Promise.allSettled([
                fetchTheme().catch(themeErr => {
                  console.warn('Theme fetch failed:', themeErr);
                  return null; // Allow fallback to default theme
                }),
                regionId
                  ? fetchPages(regionId).catch(pagesErr => {
                      console.warn('Pages fetch failed:', pagesErr);
                      return null; // Allow fallback to empty pages
                    })
                  : Promise.resolve(null),
              ]);
            })
        );

        // Wait for all tasks to complete (success or failure)
        await Promise.allSettled(tasks);

        // Mark initialization as complete
        setIsInitialized(true);
      } catch (initErr: unknown) {
        console.error('App initialization failed:', initErr);
        // Error will be handled by the store states
      }
    },
    [
      location,
      selectedAddress,
      permissionStatus,
      fetchVendors,
      isLoggedIn,
      fetchInitialConfig,
      fetchTheme,
    ]
  );

  /**
   * Initializes the user's selected address based on various scenarios
   * Handles location permissions, saved addresses, and fallback strategies
   */
  const initializeSelectedAddress = useCallback(async (): Promise<void> => {
    try {
      // Don't override if address is already selected
      if (selectedAddress) {
        return;
      }

      // Get current addresses from store
      const addresses: Address[] = useAddressStore.getState().addresses as unknown as Address[];

      // CASE 1: Location permission granted and coordinates available
      if (permissionStatus === 'granted' && location?.latitude && location?.longitude) {
        // Try to find closest saved address within 200m radius

        if (addresses && addresses.length > 0) {
          const closest = findClosestAddressWithinRadius(
            { latitude: location.latitude, longitude: location.longitude },
            addresses as unknown as Array<{ [key: string]: unknown }>,
            200 // 200 meters radius
          );
          if (closest?.address) {
            setSelectedAddress(closest.address as unknown as Address);
            return;
          }
        }

        // No close saved address found - reverse geocode current location
        const components = await getAddressFromCoordinates({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        const currentAddress: Address = {
          addressID: 'current-location',
          name: 'Current Location',
          phone: '',
          city: components.city || '',
          state: components.state || '',
          tag: 'Home',
          addressLine1: components.formatted_address || 'Current Location',
          addressLine2: '',
          addressLine3: '',
          postalCode: components.postalCode || '',
          coordinates: {
            longitude: location.longitude,
            latitude: location.latitude,
          },
        };
        setSelectedAddress(currentAddress);
        return;
      }

      // CASE 2: No location permission but saved addresses exist
      else if (permissionStatus !== 'granted' && addresses && addresses.length > 0) {
        // Try to use the default address from auth data
        if (authData?.defaultAddressId) {
          const defaultAddress = addresses.find(
            addr => addr.addressID === authData.defaultAddressId
          );
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
            return;
          }
        }
        // Fallback to first saved address if no defaultAddressId
        setSelectedAddress(addresses[0]);
        return;
      }

      // CASE 3: No location permission and no saved addresses
      else if (permissionStatus !== 'granted' && (!addresses || addresses.length === 0)) {
        // Try to use default location from config
        const defaultLocation = getDefaultLocation();

        if (defaultLocation) {
          // Reverse geocode the default location from config
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

        // Final fallback to hardcoded default address
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
            longitude: 77.209, // Connaught Place, Delhi coordinates
            latitude: 28.6139,
          },
        };
        setSelectedAddress(fallbackAddress);
      }

      // CASE 4: Location permission granted but no coordinates available
      else if (permissionStatus === 'granted' && (!location?.latitude || !location?.longitude)) {
        // Wait for location to be available or use fallback
        console.warn('Location permission granted but coordinates not available');
        // Could implement a retry mechanism here if needed
      }

      // CASE 5: Unexpected state - no conditions met
      else {
        console.warn('Unexpected state in address initialization:', {
          permissionStatus,
          hasLocation: Boolean(location?.latitude && location?.longitude),
          hasAddresses: Boolean(addresses && addresses.length > 0),
        });
      }
    } catch (e) {
      // Fail silently; selected address remains unset
      console.warn('Address initialization failed:', e);
    }
  }, [
    permissionStatus,
    location?.latitude,
    location?.longitude,
    selectedAddress,
    setSelectedAddress,
    authData?.defaultAddressId,
    getDefaultLocation,
  ]);

  /**
   * Retry function to restart initialization process
   */
  const handleRetry = () => {
    setIsInitialized(false);
    // Use optimized function to get permission and location with minimal time
    getPermissionAndLocation()
      .then(({ permission, location: _locationResult }) => {
        setPermissionStatus(permission);

        return initializeApp().then(() => {
          return initializeSelectedAddress();
        });
      })
      .catch(error => {
        console.warn('❌ [AppInitializer] Failed to get permission and location on retry:', error);
        // Even if location fails, try to initialize app

        return initializeApp().then(() => {
          return initializeSelectedAddress();
        });
      });
  };

  /**
   * Effect to trigger initialization on component mount
   */
  useEffect(() => {
    if (!isInitialized) {
      // Use optimized function to get permission and location with minimal time
      getPermissionAndLocation()
        .then(({ permission, location: _locationResult }) => {
          setPermissionStatus(permission);

          // Initialize app regardless of location success/failure

          return initializeApp().then(() => {
            return initializeSelectedAddress();
          });
        })
        .catch(error => {
          console.warn('❌ [AppInitializer] Failed to get permission and location:', error);
          // Even if location fails, try to initialize app

          return initializeApp().then(() => {
            return initializeSelectedAddress();
          });
        });
    }
  }, [getPermissionAndLocation, initializeApp, initializeSelectedAddress, isInitialized]);

  /**
   * Effect to handle selectedAddress changes - re-fetch config, vendors, and theme
   */
  useEffect(() => {
    if (isInitialized && selectedAddress) {
      // Re-fetch only config, vendors, and theme (skip addresses)
      initializeApp(true).then(() => {});
    }
  }, [selectedAddress, isInitialized, initializeApp]);

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

  // Fallback loading state (should rarely be reached)
  return <HomeScreenSkeleton />;
};

export default AppInitializer;
