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
  };
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
  location: { latitude: number; longitude: number } | null;
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

  /** 🔹 Single helper to update state */
  const updateLocation = (coords: { latitude: number; longitude: number }) => {
    setLocation({ ...coords, error: null });
  };

  /** 🔹 Wrap Geolocation.getCurrentPosition into Promise */
  const fetchLocation = useCallback(
    (options: { enableHighAccuracy: boolean; timeout: number; maximumAge: number }) =>
      new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        if (hasSkippedLocation) {
          reject(new Error('Location permission skipped by user'));
          return;
        }
        Geolocation.getCurrentPosition(
          (pos: GeolocationPosition) => {
            const coords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            };
            updateLocation(coords);
            resolve(coords);
          },
          (err: GeolocationError) => {
            setLocation({ latitude: null, longitude: null, error: err.message });
            reject(err);
          },
          options
        );
      }),
    [hasSkippedLocation]
  );

  /** 🔹 Check permission */
  const checkLocationPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await check(locationPermission);
      setPermissionStatus(result);

      if (result === RESULTS.GRANTED) {
        setHasSkippedLocation(false);
        setSkipPermissions(false);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [locationPermission]);

  /** 🔹 Request permission */
  const requestLocationPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await request(locationPermission);
      setPermissionStatus(result);

      if (result === RESULTS.GRANTED) {
        setHasSkippedLocation(false);
        setSkipPermissions(false);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [locationPermission]);

  /** 🔹 Optimized permission + location fetch */
  const getPermissionAndLocation = useCallback(async (): Promise<PermissionAndLocation> => {
    try {
      const permission = await check(locationPermission);
      setPermissionStatus(permission);

      if (permission !== RESULTS.GRANTED) {
        return { permission, location: null };
      }

      // 1. Try quick cached fix
      const cached = await fetchLocation({
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 5 * 60 * 1000,
      }).catch(() => null);

      if (cached) {
        // Fire background refresh, but don’t block UI
        fetchLocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }).catch(err =>
          console.warn('Background location refresh failed:', err.message)
        );
        console.log('cached', cached);

        return { permission, location: cached };
      }

      // 2. Otherwise, wait for a fresh fix
      const live = await fetchLocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      return { permission, location: live };
    } catch (err: any) {
      console.error('❌ [useLocation] Error in getPermissionAndLocation:', err);
      setPermissionStatus(RESULTS.UNAVAILABLE);
      setLocation({
        latitude: null,
        longitude: null,
        error: err?.message ?? 'Unknown error',
      });
      return { permission: RESULTS.UNAVAILABLE, location: null };
    }
  }, [locationPermission, fetchLocation]);

  /** 🔹 Skip flow */
  const skipLocationPermission = () => {
    setSkipPermissions(true);
    setHasSkippedLocation(true);
    setPermissionStatus(RESULTS.DENIED);
    setLocation({ latitude: null, longitude: null, error: 'Location permission skipped by user' });
  };

  /** 🔹 Denied permission modal */
  const handleDeniedPermissionModal = () => {
    Alert.alert(
      'Permission Required',
      'We need access to your location to provide accurate results and personalized services. Please enable location permissions in your device settings.',
      [
        { text: 'Skip', onPress: skipLocationPermission, style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => openSettings().catch(() => console.warn('Cannot open settings')),
        },
      ]
    );
  };

  /** 🔹 Check permission on app focus */
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (await getSkipPermission()) {
        setHasSkippedLocation(true);
      }
      if (mounted) checkLocationPermission();
    })();

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && mounted) {
        checkLocationPermission();
      }
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [checkLocationPermission]);

  return {
    permissionStatus,
    isLoading,
    location,
    hasSkippedLocation,
    getCurrentLocation: fetchLocation,
    checkLocationPermission,
    requestLocationPermission,
    getPermissionAndLocation,
    handleDeniedPermissionModal,
    skipLocationPermission,
    // derived helpers
    isGranted: permissionStatus === RESULTS.GRANTED,
    isDenied: permissionStatus === RESULTS.DENIED,
    isBlocked: permissionStatus === RESULTS.BLOCKED,
    isUnavailable: permissionStatus === RESULTS.UNAVAILABLE,
  };
};
