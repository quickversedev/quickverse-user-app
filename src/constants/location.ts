import { Address } from '../types/address';

export const DEFAULT_FALLBACK_COORDINATES: { latitude: number; longitude: number } = {
  latitude: 18.9957059,
  longitude: 75.7521886,
};

export const DEFAULT_FALLBACK_ADDRESS: Address = {
  addressID: 'default-fallback-location',
  name: 'Beed',
  phone: '',
  city: 'Beed',
  state: 'Maharashtra',
  tag: 'QV_Default_Location',
  addressLine1: 'Beed, Maharashtra',
  addressLine2: '',
  addressLine3: '',
  postalCode: '',
  coordinates: {
    latitude: DEFAULT_FALLBACK_COORDINATES.latitude,
    longitude: DEFAULT_FALLBACK_COORDINATES.longitude,
  },
  isSavedAddress: false,
};

export const DEFAULT_FALLBACK_REGION = {
  latitude: DEFAULT_FALLBACK_COORDINATES.latitude,
  longitude: DEFAULT_FALLBACK_COORDINATES.longitude,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};
