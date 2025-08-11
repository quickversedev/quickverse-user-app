import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useAddress, useConfig } from '../../hooks';
import { useLocation } from '../../hooks/Permissions/useLocation';
import TabNavigation from '../../navigation/TabNavigation';
import { findClosestAddressWithinRadius } from '../../screens/profile/Address/utils/addressUtils';
import { getAddressFromCoordinates } from '../../services/api/olaLocationService';
import useAddressStore from '../../store/address/addressStore';
import useThemeStore from '../../store/themeStore';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import type { Address } from '../../types/address';
import ErrorState from './ErrorState';

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
  // Theme and UI state
  const { getColor } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  // Location services
  const { location, getPermissionAndLocation } = useLocation();
  // console.log('AppInitializer location', location);
  // Store hooks for data fetching
  const { fetchVendors, loading: vendorLoading, error: vendorError } = useVendorStore();
  const { fetchAddresses, loading: addressLoading, error: addressError } = useAddress();
  const {
    fetchInitialConfig,
    loading: configLoading,
    error: configError,
    getDefaultLocation,
  } = useConfig();
  const { fetchTheme } = useThemeStore();

  // Authentication and address selection
  const { setSelectedAddress, selectedAddress, authData } = useAuth();
  const isLoggedIn = Boolean(authData?.jwt);

  // Combined loading and error states for UI
  const isLoading = vendorLoading || addressLoading || configLoading;
  const error = vendorError || addressError || configError;

  /**
   * Main initialization function that fetches all required data
   * Executes API calls in parallel with proper error handling
   * @param skipAddressFetch - If true, skips fetching addresses (used when selectedAddress changes)
   */
  const initializeApp = useCallback(
    async (skipAddressFetch = false) => {
      try {
        // Build an array of promises for parallel execution
        const tasks: Array<Promise<unknown>> = [
          // Always fetch vendors with location data if available
          fetchVendors(
            location?.latitude && location?.longitude
              ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  radiusKm: 5, // Default 5km radius for vendor search
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

        // Always fetch initial config and theme (with location if available)
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
              // Always fetch theme regardless of config fetch success/failure
              return fetchTheme().catch(themeErr => {
                console.warn('Theme fetch failed:', themeErr);
                return null; // Allow fallback to default theme
              });
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
      fetchVendors,
      isLoggedIn,
      location?.latitude,
      location?.longitude,
      fetchAddresses,
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
          id: 'current-location',
          address: components.formatted_address || 'Current Location',
          city: components.city || '',
          state: components.state || '',
          postalCode: components.postalCode || '',
          country: components.country || '',
          isDefault: true,
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
        };
        setSelectedAddress(currentAddress);
        return;
      }

      // CASE 2: No location permission but saved addresses exist
      else if (permissionStatus !== 'granted' && addresses && addresses.length > 0) {
        // Try to use the default address from auth data
        if (authData?.defaultAddressId) {
          const defaultAddress = addresses.find(addr => addr.id === authData.defaultAddressId);
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
              id: 'config-default-location',
              address: components.formatted_address || 'Default Location',
              city: components.city || '',
              state: components.state || '',
              postalCode: components.postalCode || '',
              country: components.country || '',
              isDefault: true,
              latitude: defaultLocation.latitude,
              longitude: defaultLocation.longitude,
            };
            setSelectedAddress(configAddress);
            return;
          } catch (geocodeError) {
            console.warn('Failed to reverse geocode default location:', geocodeError);
          }
        }

        // Final fallback to hardcoded default address
        const fallbackAddress: Address = {
          id: 'fallback-default-location',
          address: 'Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          country: 'India',
          isDefault: true,
          latitude: '28.6139', // Connaught Place, Delhi coordinates
          longitude: '77.2090',
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
      .then(({ permission, location: locationResult }) => {
        setPermissionStatus(permission);
        console.log(
          '🔍 [AppInitializer] Retry - Permission:',
          permission,
          'Location:',
          locationResult
        );

        // Initialize app regardless of location success/failure
        console.log('🚀 [AppInitializer] Starting app initialization after retry');
        return initializeApp().then(() => {
          console.log(
            '🏠 [AppInitializer] App initialized, starting address initialization on retry'
          );
          return initializeSelectedAddress();
        });
      })
      .catch(error => {
        console.warn('❌ [AppInitializer] Failed to get permission and location on retry:', error);
        // Even if location fails, try to initialize app
        console.log('🚀 [AppInitializer] Starting app initialization after retry error');
        return initializeApp().then(() => {
          console.log(
            '🏠 [AppInitializer] App initialized after retry error, starting address initialization'
          );
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
        .then(({ permission, location: locationResult }) => {
          setPermissionStatus(permission);
          console.log('🔍 [AppInitializer] Permission:', permission, 'Location:', locationResult);

          // Initialize app regardless of location success/failure
          console.log('🚀 [AppInitializer] Starting app initialization');
          return initializeApp().then(() => {
            console.log('🏠 [AppInitializer] App initialized, starting address initialization');
            return initializeSelectedAddress();
          });
        })
        .catch(error => {
          console.warn('❌ [AppInitializer] Failed to get permission and location:', error);
          // Even if location fails, try to initialize app
          console.log('🚀 [AppInitializer] Starting app initialization after error');
          return initializeApp().then(() => {
            console.log(
              '🏠 [AppInitializer] App initialized after error, starting address initialization'
            );
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
      console.log(
        '🏠 [AppInitializer] Selected address changed, re-fetching config, vendors, and theme'
      );
      // Re-fetch only config, vendors, and theme (skip addresses)
      initializeApp(true).then(() => {
        console.log('✅ [AppInitializer] Re-fetch completed for address change');
      });
    }
  }, [selectedAddress, isInitialized, initializeApp]);

  // Show loading spinner during initialization
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: getColor('background') }]}>
        <ActivityIndicator size="large" color={getColor('primary')} />
      </View>
    );
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
  return (
    <View style={[styles.container, { backgroundColor: getColor('card') }]}>
      <ActivityIndicator size="large" color={getColor('primary')} />
    </View>
  );
};

/**
 * Styles for the AppInitializer component
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppInitializer;
