// src/services/storage.service.ts
import { MMKV } from 'react-native-mmkv';
import { PermissionStatus } from 'react-native-permissions';

// Initialize MMKV
export const storage = new MMKV();

/**
 * Zustand-compatible storage adapter for MMKV
 * Used with createJSONStorage(() => mmkvStorage) in Zustand persist middleware
 */
export const mmkvStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.remove(name);
  },
};
const AUTH_DATA_KEY = '@AuthData';
const NEW_USER_key = '@NewUser';
const SKIP_PERMISSIONS = '@SkipPermission';
const SKIP_LOGIN_KEY = '@skipLogin';
const ALREADY_LAUNCHED_KEY = '@alreadyLaunched';
const REGION_ID_KEY = '@RegionId';
const USER_ADDRESSES_KEY = '@UserAddresses';
const RECENT_SEARCHES_KEY = '@RecentSearches';
const LOCATION_COORDS_KEY = '@LocationCoords';
const LOCATION_PERMISSION_KEY = '@LocationPermission';

export const setSkipLoginFlow = (skipLogin: boolean): void => {
  storage.set(SKIP_LOGIN_KEY, skipLogin);
};

export const getSkipLoginFlow = (): boolean | undefined => {
  return storage.getBoolean(SKIP_LOGIN_KEY);
};

export type AuthSession = {
  jwt: string;
  phone: string;
  username: string;
  defaultAddressId?: string; // Made optional since it's not used
};

/**
 * Stores auth session object in storage
 */
export const setAuthSession = (session: AuthSession): void => {
  try {
    storage.set(AUTH_DATA_KEY, JSON.stringify(session));
  } catch {
    // noop
  }
};

/**
 * Loads auth session object from storage
 */
export const getAuthSession = (): AuthSession | undefined => {
  const raw = storage.getString(AUTH_DATA_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (
      parsed &&
      typeof parsed.jwt === 'string' &&
      typeof parsed.phone === 'string' &&
      typeof parsed.username === 'string' &&
      (parsed.defaultAddressId === undefined || typeof parsed.defaultAddressId === 'string')
    ) {
      return parsed;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

/**
 * Removes auth session from storage
 */
export const removeAuthSession = (): void => {
  storage.remove(AUTH_DATA_KEY);
};
/**
 * Sets skip permission in storage
 * @param skip boolean
 */
export const setSkipPermissions = (skip: boolean): void => {
  storage.set(SKIP_PERMISSIONS, skip);
};

/**
 * Gets auth token string from storage
 * @returns string | undefined
 */
export const getSkipPermission = (): boolean | undefined => {
  return storage.getBoolean(SKIP_PERMISSIONS) ?? undefined;
};

/**
 * Removes auth token from storage
 */
export const removeSkipPermission = (): void => {
  storage.remove(SKIP_PERMISSIONS);
};

/**
 * Sets auth token string in storage
 * @param newUser boolean
 */
export const setNewUser = (newUser: boolean): void => {
  storage.set(NEW_USER_key, newUser);
};

/**
 * Gets auth token string from storage
 * @returns string | undefined
 */
export const getNewUser = (): boolean | undefined => {
  return storage.getBoolean(NEW_USER_key) ?? undefined;
};

/**
 * Removes auth token from storage
 */
export const removeNewUser = (): void => {
  storage.remove(NEW_USER_key);
};

/**
 * Sets alreadyLaunched flag in storage
 * @param launched boolean
 */
export const setAlreadyLaunched = (launched: boolean): void => {
  storage.set(ALREADY_LAUNCHED_KEY, launched);
};

/**
 * Gets alreadyLaunched flag from storage
 * @returns boolean | undefined
 */
export const getAlreadyLaunched = (): boolean | undefined => {
  return storage.getBoolean(ALREADY_LAUNCHED_KEY) ?? undefined;
};

/**
 * Removes alreadyLaunched flag from storage
 */
export const removeAlreadyLaunched = (): void => {
  storage.remove(ALREADY_LAUNCHED_KEY);
};

/**
 * Sets RegionId in storage
 * @param regionId string
 */
export const setRegionId = (regionId: string): void => {
  storage.set(REGION_ID_KEY, regionId);
};

/**
 * Gets RegionId from storage
 * @returns string | undefined
 */
export const getRegionId = (): string | undefined => {
  return storage.getString(REGION_ID_KEY) ?? undefined;
};

/**
 * Removes RegionId from storage
 */
export const removeRegionId = (): void => {
  storage.remove(REGION_ID_KEY);
};

/**
 * Sets user addresses in storage
 * @param addresses Address array
 */
export const setUserAddresses = (addresses: any[]): void => {
  try {
    storage.set(USER_ADDRESSES_KEY, JSON.stringify(addresses));
  } catch {
    // noop
  }
};

/**
 * Gets user addresses from storage
 * @returns Address array or undefined
 */
export const getUserAddresses = (): any[] | undefined => {
  // //console.log('getUserAddresses from storage', storage.getString(USER_ADDRESSES_KEY));
  const raw = storage.getString(USER_ADDRESSES_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as any[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

/**
 * Removes user addresses from storage
 */
export const removeUserAddresses = (): void => {
  storage.remove(USER_ADDRESSES_KEY);
};

/**
 * Sets recent searches in storage
 * @param searches RecentSearch array
 */
export const setRecentSearches = (searches: any[]): void => {
  try {
    storage.set(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // noop
  }
};

/**
 * Gets recent searches from storage
 * @returns RecentSearch array or undefined
 */
export const getRecentSearches = (): any[] | undefined => {
  const raw = storage.getString(RECENT_SEARCHES_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as any[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

/**
 * Adds a new search to recent searches
 * @param searchText string
 * @param icon string (optional)
 */
export const addRecentSearch = (searchText: string, icon: string = 'magnify'): void => {
  try {
    const existingSearches = getRecentSearches() || [];

    // Remove if already exists (to move to top)
    const filteredSearches = existingSearches.filter(
      (search: any) => search.text.toLowerCase() !== searchText.toLowerCase()
    );

    // Add new search at the beginning
    const newSearch = {
      id: Date.now().toString(),
      text: searchText,
      icon: icon,
    };

    const updatedSearches = [newSearch, ...filteredSearches];

    // Limit to maximum 10 recent searches
    const limitedSearches = updatedSearches.slice(0, 10);

    setRecentSearches(limitedSearches);
  } catch {
    // noop
  }
};

/**
 * Removes recent searches from storage
 */
export const removeRecentSearches = (): void => {
  storage.remove(RECENT_SEARCHES_KEY);
};

export const StorageService = {
  clearAll: (): void => {
    storage.clearAll();
  },
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },
  getItem: (key: string): string | undefined => {
    return storage.getString(key) ?? undefined;
  },
  removeItem: (key: string): void => {
    storage.remove(key);
  },
};

/**
 * Location storage helpers (MMKV)
 */
export type StoredCoords = { latitude: number; longitude: number };

export const setLocationCoords = (coords: StoredCoords): void => {
  try {
    storage.set(LOCATION_COORDS_KEY, JSON.stringify(coords));
  } catch {
    // noop
  }
};

export const getLocationCoords = (): StoredCoords | undefined => {
  const raw = storage.getString(LOCATION_COORDS_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as StoredCoords;
    if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
      return parsed;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

export const removeLocationCoords = (): void => {
  storage.remove(LOCATION_COORDS_KEY);
};

export const setLocationPermission = (permission: PermissionStatus): void => {
  storage.set(LOCATION_PERMISSION_KEY, permission);
};

export const getLocationPermission = (): PermissionStatus | undefined => {
  return (storage.getString(LOCATION_PERMISSION_KEY) as PermissionStatus) ?? undefined;
};

export const removeLocationPermission = (): void => {
  storage.remove(LOCATION_PERMISSION_KEY);
};
