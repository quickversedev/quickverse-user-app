import Geolocation from '@react-native-community/geolocation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import {
  check,
  openSettings,
  PERMISSIONS,
  PermissionStatus,
  request,
  RESULTS,
} from 'react-native-permissions';
import { getSkipPermission, setSkipPermissions } from '../../services/localStorage/storage.service';

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

type Location = {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
};

export type PermissionAndLocation = {
  permission: PermissionStatus;
  location: { latitude: number; longitude: number };
};

export const useLocation = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(RESULTS.UNAVAILABLE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [location, setLocation] = useState<Location>({
    latitude: null,
    longitude: null,
    error: null,
  });
  const [hasSkippedLocation, setHasSkippedLocation] = useState<boolean>(false);

  const locationPermission = useMemo(
    () =>
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    []
  );

  const checkLocationPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await check(locationPermission);
      setPermissionStatus(result);
      // Reset hasSkippedLocation if permission is granted
      if (result === RESULTS.GRANTED) {
        setHasSkippedLocation(false);
        setSkipPermissions(false);
      }
      return result;
    } catch (error) {
      console.error('Error checking location permission:', error);
      setPermissionStatus(RESULTS.UNAVAILABLE);
      return RESULTS.UNAVAILABLE;
    } finally {
      setIsLoading(false);
    }
  }, [locationPermission]);

  const getCurrentLocation = useCallback(
    (highAccuracy = false) => {
      return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        if (hasSkippedLocation) {
          setLocation({
            latitude: null,
            longitude: null,
            error: 'Location permission skipped by user',
          });
          reject(new Error('Location permission skipped by user'));
          return;
        }

        setIsLoading(true);
        Geolocation.getCurrentPosition(
          (position: GeolocationPosition) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setLocation({
              ...coords,
              error: null,
            });
            setIsLoading(false);
            resolve(coords);
          },
          (error: GeolocationError) => {
            setLocation({
              latitude: null,
              longitude: null,
              error: error.message,
            });
            setIsLoading(false);
            reject(error);
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      });
    },
    [hasSkippedLocation]
  );

  const requestLocationPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await request(locationPermission);
      setPermissionStatus(result);
      // If user grants permission, reset the skipped flag
      if (result === RESULTS.GRANTED) {
        setHasSkippedLocation(false);
        setSkipPermissions(false);
      }
      return result;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setPermissionStatus(RESULTS.UNAVAILABLE);
      return RESULTS.UNAVAILABLE;
    } finally {
      setIsLoading(false);
    }
  }, [locationPermission]);

  const handleDeniedPermissionModal = () => {
    Alert.alert(
      'Permission Required',
      'We need access to your location to provide accurate results and personalized services. Please enable location permissions in your device settings.',
      [
        {
          text: 'Skip',
          onPress: () => {
            handleSkipPermission();
            setPermissionStatus(RESULTS.DENIED);
          },
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => openSettings().catch(() => console.warn('Cannot open settings')),
        },
      ]
    );
  };

  const handleSkipPermission = () => {
    setSkipPermissions(true);
    setHasSkippedLocation(true);
  };

  const skipLocationPermission = () => {
    handleSkipPermission();
    setPermissionStatus(RESULTS.DENIED);
    setLocation({
      latitude: null,
      longitude: null,
      error: 'Location permission skipped by user',
    });
  };

  /**
   * Optimized function that returns both permission status and current location
   * This function minimizes time by checking permission and getting location in sequence
   * Returns: { permission: string, location: { latitude: number, longitude: number } | null }
   */
  const getPermissionAndLocation = useCallback(async () => {
    try {
      // Step 1: Check permission status
      const permission = await check(locationPermission);

      // Update state immediately
      setPermissionStatus(permission);

      // Step 2: If permission granted, get location immediately
      if (permission === RESULTS.GRANTED) {
        // Reset skipped flags
        setHasSkippedLocation(false);
        setSkipPermissions(false);

        // Get location with optimized settings
        const locationResult = await new Promise<{ latitude: number; longitude: number }>(
          (resolve, reject) => {
            // Note: Once permission is granted above, we should not block
            // location retrieval based on any previously skipped state.
            // Proceed to fetch current position.

            Geolocation.getCurrentPosition(
              (position: GeolocationPosition) => {
                const coords = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                // Update state immediately
                setLocation({
                  ...coords,
                  error: null,
                });

                resolve(coords);
              },
              (error: GeolocationError) => {
                const errorState = {
                  latitude: null,
                  longitude: null,
                  error: error.message,
                };
                setLocation(errorState);
                console.warn('❌ [useLocation] Location fetch failed:', error.message);
                reject(error);
              },
              {
                enableHighAccuracy: false, // Faster, less battery
                timeout: 10000, // Reduced timeout for faster failure
                maximumAge: 30000, // Accept cached location up to 30 seconds
              }
            );
          }
        );

        return {
          permission,
          location: locationResult,
        };
      } else {
        // Permission not granted, return null location
        return {
          permission,
          location: null,
        };
      }
    } catch (error) {
      console.error('❌ [useLocation] Error in getPermissionAndLocation:', error);
      setPermissionStatus(RESULTS.UNAVAILABLE);
      setLocation({
        latitude: null,
        longitude: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        permission: RESULTS.UNAVAILABLE,
        location: null,
      };
    }
  }, [locationPermission, hasSkippedLocation]);

  useEffect(() => {
    let isMounted = true;

    const checkInitialPermissions = async () => {
      const hasSkippedPermissions = await getSkipPermission();
      if (isMounted) {
        if (hasSkippedPermissions) {
          setHasSkippedLocation(true);
        }
        checkLocationPermission();
      }
    };

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && isMounted) {
        checkLocationPermission();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    checkInitialPermissions();

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [checkLocationPermission]);

  return {
    permissionStatus,
    isLoading,
    location,
    hasSkippedLocation,
    getCurrentLocation,
    checkLocationPermission,
    requestLocationPermission,
    handleDeniedPermissionModal,
    skipLocationPermission,
    getPermissionAndLocation,
    isGranted: permissionStatus === RESULTS.GRANTED,
    isDenied: permissionStatus === RESULTS.DENIED,
    isBlocked: permissionStatus === RESULTS.BLOCKED,
    isUnavailable: permissionStatus === RESULTS.UNAVAILABLE,
  };
};
