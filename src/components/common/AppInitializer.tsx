import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useAddress, useAppStateRefresh, useConfig, usePages } from '../../hooks';
import { useNetworkRecovery } from '../../hooks/useNetworkRecovery';
import { PermissionAndLocation } from '../../hooks/Permissions/useLocation';
import { getAddressFromCoordinates } from '../../services/api/olaLocationService';
import { getUserAddresses } from '../../services/localStorage/storage.service';
import useAddressStore from '../../store/address/addressStore';
import useConfigStore from '../../store/configStore';
import useOrderStore from '../../store/cart/orderStore';
import usePricingStore from '../../store/pricingStore';
import useThemeStore from '../../store/themeStore';
import useVendorStore from '../../store/vendorStore';
import { DEFAULT_FALLBACK_ADDRESS, DEFAULT_FALLBACK_COORDINATES } from '../../constants/location';
import { Address } from '../../types/address';
import ErrorState from './ErrorState';
import LocationRequiredModal from './LocationRequiredModal';
import NoInternetOverlay from './NoInternetOverlay';
import { HomeScreenSkeleton } from './skeleton';

interface AppInitializerProps {
  locationData: PermissionAndLocation | null;
  children?: React.ReactNode;
}

type PersistStore = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
};

function waitForHydration(): Promise<void> {
  const stores: PersistStore[] = [useConfigStore, useVendorStore, useThemeStore, usePricingStore];
  const pending = stores.filter(s => !s.persist.hasHydrated());
  if (pending.length === 0) return Promise.resolve();
  return Promise.all(
    pending.map(
      s =>
        new Promise<void>(resolve => {
          const unsub = s.persist.onFinishHydration(() => {
            unsub();
            resolve();
          });
        })
    )
  ).then(() => {});
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children, locationData }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initComplete, setInitComplete] = useState(false);
  const initializationRef = useRef(false);
  const prevAddressRef = useRef<Address | null>(null);
  const warmStartRef = useRef(false);

  const {
    fetchVendors,
    loading: vendorLoading,
    error: vendorError,
    setError,
    invalidateCache: invalidateVendorCache,
  } = useVendorStore();
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

  const { setSelectedAddress, selectedAddress, authData } = useAuth();
  const isLoggedIn = Boolean(authData?.jwt);

  const refreshAppData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const vendorPromise = fetchVendors(selectedAddress?.coordinates || undefined).catch(() => {
        if (isInitialized) setError(null);
      });

      await Promise.allSettled([
        vendorPromise,
        fetchAddresses(),
        fetchInitialConfig({
          longitude:
            locationData?.location?.longitude?.toString() ||
            String(DEFAULT_FALLBACK_COORDINATES.longitude),
          latitude:
            locationData?.location?.latitude?.toString() ||
            String(DEFAULT_FALLBACK_COORDINATES.latitude),
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
    refreshThreshold: 120000,
    enabled: isLoggedIn && isInitialized,
  });

  const { isConnected, manualRetry } = useNetworkRecovery({
    onReconnect: refreshAppData,
    enabled: isLoggedIn && isInitialized,
  });

  const cachedAddresses = isLoggedIn ? getUserAddresses() : undefined;
  const hasCachedAddresses = cachedAddresses && cachedAddresses.length > 0;

  const isLoading =
    (!isInitialized && vendorLoading) ||
    (!initComplete && !hasCachedAddresses && addressLoading) ||
    (!isInitialized && (configLoading || pagesLoading));
  const error = !isInitialized ? vendorError : null;
  const { longitude: currentLongitude, latitude: currentLatitude } = locationData?.location || {};
  const permissionStatus = locationData?.permission;

  const initializeSelectedAddress = useCallback(async (): Promise<void> => {
    try {
      if (selectedAddress) {
        return;
      }

      const addresses: Address[] = useAddressStore.getState().addresses as unknown as Address[];

      const applyCurrentLocationFallback = async () => {
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
          } catch (_geocodeError) {
            console.warn('Reverse geocoding failed in fallback:', _geocodeError);
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

        if (addresses && addresses.length > 0) {
          setSelectedAddress(addresses[0]);
          return;
        }

        setSelectedAddress(DEFAULT_FALLBACK_ADDRESS);
      };

      if (permissionStatus === 'granted' && currentLatitude && currentLongitude) {
        try {
          const components = await getAddressFromCoordinates({
            latitude: currentLatitude,
            longitude: currentLongitude,
          });

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
        } catch (_geocodeError) {
          console.warn(
            'Failed to reverse geocode current location, using default config:',
            _geocodeError
          );
          await applyCurrentLocationFallback();
          return;
        }
      } else if (
        (!permissionStatus || permissionStatus !== 'granted') &&
        addresses &&
        addresses.length > 0
      ) {
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

    try {
      // Wait for Zustand persist to finish rehydrating from MMKV
      await waitForHydration();

      const hasPersistedData =
        useConfigStore.getState().hasConfig() && useVendorStore.getState().vendors.length > 0;

      let storedAddresses: Address[] = [];
      if (isLoggedIn) {
        storedAddresses = await loadAddressesFromStorage();
      }

      if (hasPersistedData) {
        warmStartRef.current = true;
        setInitComplete(true);
        setIsInitialized(true);

        // Address init + background revalidation — non-blocking
        // selectedAddress is null here (AuthProvider restores it after this effect),
        // so don't await geocoding — let the prevAddressRef effect handle it.
        initializeSelectedAddress().catch(() => {});
        Promise.allSettled([
          fetchInitialConfig({
            longitude:
              selectedAddress?.coordinates?.longitude?.toString() ||
              locationData?.location?.longitude?.toString() ||
              String(DEFAULT_FALLBACK_COORDINATES.longitude),
            latitude:
              selectedAddress?.coordinates?.latitude?.toString() ||
              locationData?.location?.latitude?.toString() ||
              String(DEFAULT_FALLBACK_COORDINATES.latitude),
          }),
          isLoggedIn ? fetchAddresses() : Promise.resolve(),
          fetchTheme(),
          fetchPages(),
          fetchPricing('FOOD'),
          fetchPricing('GROCERY'),
          isLoggedIn && authData?.jwt && authData?.phone
            ? fetchOrders(authData.jwt, authData.phone, null, 5)
            : Promise.resolve(),
        ]).catch(() => {});
        return;
      }

      // Cold start: no persisted data — sequential fetch with skeleton
      const configPromise = fetchInitialConfig({
        longitude:
          selectedAddress?.coordinates?.longitude?.toString() ||
          locationData?.location?.longitude?.toString() ||
          String(DEFAULT_FALLBACK_COORDINATES.longitude),
        latitude:
          selectedAddress?.coordinates?.latitude?.toString() ||
          locationData?.location?.latitude?.toString() ||
          String(DEFAULT_FALLBACK_COORDINATES.latitude),
      });

      const addressPromise = isLoggedIn
        ? (async () => {
            if (!storedAddresses || storedAddresses.length === 0) {
              await fetchAddresses();
            } else {
              fetchAddresses().catch(() => {});
            }
          })()
        : Promise.resolve();

      await Promise.allSettled([configPromise, addressPromise]);

      await Promise.allSettled([
        fetchTheme(),
        fetchPages(),
        fetchPricing('FOOD'),
        fetchPricing('GROCERY'),
      ]);

      await initializeSelectedAddress();

      if (isLoggedIn && authData?.jwt && authData?.phone) {
        await fetchOrders(authData.jwt, authData.phone, null, 5);
      }

      setInitComplete(true);
    } catch (e) {
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

  useLayoutEffect(() => {
    // Synchronous warm-start promotion — runs before first paint.
    // If stores are already hydrated with cached data, mark initialized
    // immediately so the skeleton never appears on screen.
    if (
      !isInitialized &&
      useConfigStore.persist.hasHydrated() &&
      useVendorStore.persist.hasHydrated() &&
      useConfigStore.getState().config !== null &&
      useVendorStore.getState().vendors.length > 0
    ) {
      warmStartRef.current = true;
      setIsInitialized(true);
      setInitComplete(true);
    }
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializeApp]);

  // Reactively set the current GPS location as the selected address the
  // moment location permission is granted and coordinates become available.
  useEffect(() => {
    if (selectedAddress) return;
    if (permissionStatus !== 'granted') return;
    if (!currentLatitude || !currentLongitude) return;

    let cancelled = false;
    (async () => {
      try {
        const components = await getAddressFromCoordinates({
          latitude: currentLatitude,
          longitude: currentLongitude,
        });
        if (cancelled) return;
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
      } catch (err) {
        if (cancelled) return;
        console.warn('Reverse geocode for current location failed:', err);
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedAddress, permissionStatus, currentLatitude, currentLongitude, setSelectedAddress]);

  useEffect(() => {
    const prev = prevAddressRef.current;
    const curr = selectedAddress;

    if (!prev && curr) {
      prevAddressRef.current = curr;

      // On warm start, vendors are already cached — skip invalidation
      // but still revalidate in background if TTL expired
      if (warmStartRef.current) {
        warmStartRef.current = false;
        if (!isInitialized) setIsInitialized(true);
        fetchVendors(curr.coordinates).catch(() => {});
        return;
      }

      (async () => {
        try {
          useConfigStore.getState().invalidateCache();
          await fetchInitialConfig({
            latitude: curr.coordinates?.latitude?.toString(),
            longitude: curr.coordinates?.longitude?.toString(),
          });
          await fetchPages();
        } catch (e) {
          console.warn('Config/pages re-fetch on first address set failed:', e);
        }
        invalidateVendorCache();
        fetchVendors(curr.coordinates).then(() => {
          setIsInitialized(true);
        });
      })();
      return;
    }

    if (prev && curr && prev.addressID !== curr.addressID) {
      setIsInitialized(false);
      initializationRef.current = false;
      useConfigStore.getState().invalidateCache();
      invalidateVendorCache();

      initializeApp().then(() => {
        invalidateVendorCache();
        fetchVendors(curr.coordinates).then(() => {
          setIsInitialized(true);
        });
      });
    }

    prevAddressRef.current = curr;
  }, [
    selectedAddress,
    initializeApp,
    fetchVendors,
    fetchInitialConfig,
    fetchPages,
    invalidateVendorCache,
    isInitialized,
  ]);

  if (isLoading) {
    return <HomeScreenSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        onRetry={handleRetry}
        title="App Initialization Failed"
        message="We couldn't load the necessary app data. Please check your internet connection and try again."
      />
    );
  }

  const canAutoResolveCurrentLocation = permissionStatus === 'granted';
  if (initComplete && !selectedAddress && !canAutoResolveCurrentLocation) {
    return (
      <>
        {children}
        <LocationRequiredModal />
      </>
    );
  }
  if (initComplete && !selectedAddress && canAutoResolveCurrentLocation) {
    return <>{children}</>;
  }

  if (isInitialized) {
    return (
      <>
        {children}
        <NoInternetOverlay visible={!isConnected} onRetry={manualRetry} />
      </>
    );
  }

  return <HomeScreenSkeleton />;
};

export default AppInitializer;
