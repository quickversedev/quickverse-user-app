import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useAddress, useAppStateRefresh, useConfig, usePages } from '../../hooks';
import { PermissionAndLocation } from '../../hooks/Permissions/useLocation';
import { findClosestAddressWithinRadius } from '../../screens/profile/Address/utils/addressUtils';
import { getAddressFromCoordinates } from '../../services/api/olaLocationService';
import { getUserAddresses } from '../../services/localStorage/storage.service';
import useAddressStore from '../../store/address/addressStore';
import useOrderStore from '../../store/cart/orderStore';
import usePricingStore from '../../store/pricingStore';
import useThemeStore from '../../store/themeStore';
import useVendorStore from '../../store/vendorStore';
import { Address } from '../../types/address';
import ErrorState from './ErrorState';
import LocationRequiredModal from './LocationRequiredModal';
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
 * 6. No location set → open LocationRequiredModal (user must select; no default Pune/fallback)
 */
const AppInitializer: React.FC<AppInitializerProps> = ({ children, locationData }) => {
  // UI state
  const [isInitialized, setIsInitialized] = useState(false);
  const [initComplete, setInitComplete] = useState(false);
  const initializationRef = useRef(false);
  const prevAddressRef = useRef<Address | null>(null);

  // Store hooks for data fetching
  const { fetchVendors, loading: vendorLoading, error: vendorError, setError } = useVendorStore();
  const {
    fetchAddresses,
    loading: addressLoading,
    fetchError: _addressError,
    loadAddressesFromStorage,
  } = useAddress();
  const { fetchInitialConfig, loading: configLoading, error: _configError } = useConfig();
  const { fetchTheme } = useThemeStore();
  const { fetchPages, loading: pagesLoading } = usePages();
  const { fetchOrders } = useOrderStore();
  const { fetchPricing } = usePricingStore();

  // Authentication and address selection
  const { setSelectedAddress, selectedAddress, authData } = useAuth();
  const isLoggedIn = Boolean(authData?.jwt);

  // Auto-refresh when app comes back from background
  const refreshAppData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      // Refresh critical data when app comes back from background
      const vendorPromise = fetchVendors(selectedAddress?.coordinates || undefined).catch(() => {
        // Do not surface vendor errors to global error UI when already initialized
        if (isInitialized) setError(null);
      });

      await Promise.allSettled([
        vendorPromise,
        fetchAddresses(),
        fetchInitialConfig({
          longitude: locationData?.location?.longitude?.toString(),
          latitude: locationData?.location?.latitude?.toString(),
        }),
        fetchTheme(),
        fetchPages(),
        fetchPricing('FOOD'),
        fetchPricing('GROCERY'),
        authData?.jwt && authData?.phone
          ? fetchOrders(authData.jwt, authData.phone, null, 5)
          : Promise.resolve(),
      ]);
    } catch (refreshError) {
      console.warn('Error refreshing app data:', refreshError);
    }
  }, [
    isLoggedIn,
    fetchVendors,
    fetchAddresses,
    fetchInitialConfig,
    fetchTheme,
    fetchPages,
    fetchPricing,
    fetchOrders,
    locationData?.location?.longitude,
    locationData?.location?.latitude,
    authData?.jwt,
    authData?.phone,
    selectedAddress?.coordinates,
    isInitialized,
    setError,
  ]);

  useAppStateRefresh({
    onForeground: refreshAppData,
    refreshThreshold: 120000, // Refresh after 2 minute in background
    enabled: isLoggedIn && isInitialized,
  });

  // Get cached addresses once
  const cachedAddresses = isLoggedIn ? getUserAddresses() : undefined;
  const hasCachedAddresses = cachedAddresses && cachedAddresses.length > 0;

  // Combined loading and error states for UI
  // Exclude addressLoading if we have cached addresses (non-blocking API call)
  const isLoading =
    (!isInitialized && vendorLoading) ||
    (!initComplete && !hasCachedAddresses && addressLoading) ||
    (!isInitialized && (configLoading || pagesLoading));
  const error = !isInitialized ? vendorError : null;
  const { longitude: currentLongitude, latitude: currentLatitude } = locationData?.location || {};
  const permissionStatus = locationData?.permission;
  const initializeSelectedAddress = useCallback(async (): Promise<void> => {
    try {
      console.log('🔵 [AppInitializer] initializeSelectedAddress called');
      console.log('🔵 [AppInitializer] permissionStatus:', permissionStatus);
      console.log('🔵 [AppInitializer] currentLatitude:', currentLatitude, 'currentLongitude:', currentLongitude);
      console.log('🔵 [AppInitializer] existing selectedAddress:', selectedAddress ? JSON.stringify({
        addressID: selectedAddress.addressID,
        city: selectedAddress.city,
        state: selectedAddress.state,
        addressLine1: selectedAddress.addressLine1,
        tag: selectedAddress.tag,
      }) : null);

      if (selectedAddress) {
        console.log('🔵 [AppInitializer] selectedAddress already exists, skipping');
        return;
      }

      const addresses: Address[] = useAddressStore.getState().addresses as unknown as Address[];

      const applyCurrentLocationFallback = async () => {
        console.log('🟡 [AppInitializer] applyCurrentLocationFallback called, coords:', currentLatitude, currentLongitude);
        // Use current GPS coordinates if available
        if (currentLatitude && currentLongitude) {
          try {
            const components = await getAddressFromCoordinates({
              latitude: currentLatitude,
              longitude: currentLongitude,
            });
            const currentAddress: Address = {
              addressID: 'current-location',
              name: components.postalCode || 'Current Location',
              phone: '',
              city: components.city || 'Current Location',
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
            console.warn('Reverse geocoding failed in fallback:', geocodeError);
            // Use coordinates without address details
            const gpsAddress: Address = {
              addressID: 'current-location',
              name: 'Current Location',
              phone: '',
              city: 'Current Location',
              state: '',
              tag: 'QV_Current_Location',
              addressLine1: `${currentLatitude.toFixed(4)}, ${currentLongitude.toFixed(4)}`,
              addressLine2: '',
              addressLine3: '',
              postalCode: '',
              coordinates: {
                longitude: currentLongitude,
                latitude: currentLatitude,
              },
              isSavedAddress: false,
            };
            setSelectedAddress(gpsAddress);
            return;
          }
        }

        // No GPS coordinates available — use first saved address if any
        if (addresses && addresses.length > 0) {
          setSelectedAddress(addresses[0]);
          return;
        }

        // No location, no saved addresses — show LocationRequiredModal (don't set any address)
        console.warn('No location available and no saved addresses. User must select location.');
      };

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

        // Either no saved addresses, or no saved address was close enough. Use current GPS location.
        try {
          console.log('🔵 [AppInitializer] Reverse geocoding for:', currentLatitude, currentLongitude);
          const components = await getAddressFromCoordinates({
            latitude: currentLatitude,
            longitude: currentLongitude,
          });
          console.log('🔵 [AppInitializer] Geocode result:', JSON.stringify(components));

          // If reverse geocoding didn't return useful city/state, use coordinates directly
          if (!components.city || components.city === 'unknown') {
            await applyCurrentLocationFallback();
            return;
          }

          const currentAddress: Address = {
            addressID: 'current-location',
            name: components.postalCode || 'Current Location',
            phone: '',
            city: components.city || 'Current Location',
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
          console.warn(
            'Failed to reverse geocode current location, using default config:',
            geocodeError
          );
          // Reverse geocoding failed, use current location fallback
          await applyCurrentLocationFallback();
          return;
        }
      } else if (
        (!permissionStatus || permissionStatus !== 'granted') &&
        addresses &&
        addresses.length > 0
      ) {
        // Do not auto-select first/default saved address on new device.
        // Provide the default location so it doesn't get stuck asking via modal.
        await applyCurrentLocationFallback();
        return;
      } else if (
        (!permissionStatus || permissionStatus !== 'granted') &&
        (!addresses || addresses.length === 0)
      ) {
        await applyCurrentLocationFallback();
        return;
      } else if (permissionStatus === 'granted' && (!currentLatitude || !currentLongitude)) {
        console.warn(
          'Location permission granted but coordinates not available. Falling back to default.'
        );
        await applyCurrentLocationFallback();
        return;
      } else {
        console.warn('Unexpected state in address initialization. Falling back to default.');
        await applyCurrentLocationFallback();
        return;
      }
    } catch (e) {
      console.warn('Address initialization failed:', e);
    }
  }, [selectedAddress, permissionStatus, currentLatitude, currentLongitude, setSelectedAddress]);

  const initializeApp = useCallback(async (): Promise<void> => {
    if (initializationRef.current) return;
    initializationRef.current = true;
    console.log('isLoggedIn in app initializer', selectedAddress);
    try {
      let storedAddresses: Address[] = [];
      // Step 1: Load addresses from MMKV storage first
      if (isLoggedIn) {
        storedAddresses = await loadAddressesFromStorage();
      }

      // Step 2: Fetch config in parallel - use selectedAddress if available, otherwise use locationData
      const configPromise = fetchInitialConfig({
        longitude:
          selectedAddress?.coordinates?.longitude?.toString() ||
          locationData?.location?.longitude?.toString(),
        latitude:
          selectedAddress?.coordinates?.latitude?.toString() ||
          locationData?.location?.latitude?.toString(),
      });
      // Step 3: Handle address fetching based on MMKV storage state
      const addressPromise = isLoggedIn
        ? (async () => {
            if (!storedAddresses || storedAddresses.length === 0) {
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

      // Step 4: Fetch theme, pages, and pricing configs
      await Promise.allSettled([fetchTheme(), fetchPages(), fetchPricing('FOOD'), fetchPricing('GROCERY')]);

      // Step 5: Initialize selected address
      await initializeSelectedAddress();

      // Step 6: Fetch orders if user is logged in
      if (isLoggedIn && authData?.jwt && authData?.phone) {
        await fetchOrders(authData.jwt, authData.phone, null, 5);
      }

      setInitComplete(true);
    } catch (e) {
      // Silent catch; UI handles error states from stores
      console.error('app initializer initializeApp error', e);
    }
  }, [
    fetchInitialConfig,
    fetchAddresses,
    fetchTheme,
    fetchPages,
    fetchPricing,
    fetchOrders,
    initializeSelectedAddress,
    isLoggedIn,
    locationData?.location?.latitude,
    locationData?.location?.longitude,
    selectedAddress,
    cachedAddresses,
    authData?.jwt,
    authData?.phone,
    loadAddressesFromStorage,
  ]);

  const handleRetry = useCallback(() => {
    initializationRef.current = false;
    if (selectedAddress?.coordinates) {
      setError(null);
      fetchVendors(selectedAddress.coordinates).then(() => {
        setIsInitialized(true);
      });
    } else {
      initializeApp();
    }
  }, [initializeApp, fetchVendors, selectedAddress?.coordinates, setError]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    const prev = prevAddressRef.current;
    const curr = selectedAddress;

    if (!prev && curr) {
      // null → address (first set) — re-fetch config + pages with correct coords, then vendors
      prevAddressRef.current = curr;
      (async () => {
        try {
          await fetchInitialConfig({
            latitude: curr.coordinates?.latitude?.toString(),
            longitude: curr.coordinates?.longitude?.toString(),
          });
          // Re-fetch pages with updated regionId
          await fetchPages();
        } catch (e) {
          console.warn('Config/pages re-fetch on first address set failed:', e);
        }
        fetchVendors(curr.coordinates).then(() => {
          setIsInitialized(true);
        });
      })();
      return;
    }

    if (prev && curr && prev.addressID !== curr.addressID) {
      setIsInitialized(false);
      initializationRef.current = false;

      initializeApp().then(() => {
        fetchVendors(curr.coordinates).then(() => {
          setIsInitialized(true);
        });
      });
    }

    prevAddressRef.current = curr;
  }, [selectedAddress, initializeApp, fetchVendors, fetchInitialConfig, fetchPages]);

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

  // Location not configured: show app and open location modal so user can select (avoids stuck skeleton)
  if (initComplete && !selectedAddress) {
    return (
      <>
        {children}
        <LocationRequiredModal />
      </>
    );
  }

  // Show main app content when initialization successful and location is set
  if (isInitialized) {
    return <>{children}</>;
  }

  // Fallback/loading state while initializing
  return <HomeScreenSkeleton />;
};

export default AppInitializer;
