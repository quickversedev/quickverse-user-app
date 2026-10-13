import Geolocation from '@react-native-community/geolocation';
import { useCallback, useRef, useState } from 'react';
import { getLocationCoords } from '../services/localStorage/storage.service';
import { getDistanceInKm } from '../utils/distance';

/**
 * How far an address may be from the phone before the customer is asked to confirm it.
 * Above GPS drift (tens of metres), below "a different building down the road".
 */
export const FAR_FROM_YOU_KM = 0.3;

type Coords = { latitude: number; longitude: number };

/** A fresh GPS fix if one comes quickly, else the last one the app stored; null if neither. */
const whereAmI = (): Promise<Coords | null> =>
  new Promise(resolve => {
    const fallback = () => {
      try {
        resolve(getLocationCoords() ?? null);
      } catch {
        resolve(null);
      }
    };
    try {
      Geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        fallback,
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 120000 }
      );
    } catch {
      fallback();
    }
  });

/**
 * Before placing an order: if the delivery address is more than FAR_FROM_YOU_KM from where the
 * phone is, hold the action and expose the distance for a FarFromYouDialog. Once the customer
 * confirms an address, it is not asked about again for that cart. No location available (off,
 * denied, never fetched) means nothing to compare: the action just runs.
 */
export const useFarFromYouCheck = () => {
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const pending = useRef<(() => void) | null>(null);
  const confirmedKeys = useRef(new Set<string>());

  const check = useCallback(
    async (
      key: string | null | undefined,
      address: Coords | null | undefined,
      proceed: () => void
    ) => {
      const lat = Number(address?.latitude);
      const lng = Number(address?.longitude);
      if (
        !key ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        confirmedKeys.current.has(key)
      ) {
        proceed();
        return;
      }
      const here = await whereAmI();
      if (!here) {
        proceed();
        return;
      }
      const km = getDistanceInKm(here.latitude, here.longitude, lat, lng);
      if (!Number.isFinite(km) || km <= FAR_FROM_YOU_KM) {
        proceed();
        return;
      }
      pending.current = () => {
        confirmedKeys.current.add(key);
        proceed();
      };
      setDistanceKm(km);
    },
    []
  );

  const cancel = useCallback(() => {
    pending.current = null;
    setDistanceKm(null);
  }, []);

  const confirm = useCallback(() => {
    const run = pending.current;
    pending.current = null;
    setDistanceKm(null);
    run?.();
  }, []);

  return { distanceKm, check, cancel, confirm };
};
