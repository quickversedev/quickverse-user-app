// src/services/storage.service.ts
import { MMKV } from 'react-native-mmkv';

// Initialize MMKV
export const storage = new MMKV();
const AUTH_DATA_KEY = '@AuthData';
const NEW_USER_key = '@NewUser';
const SKIP_PERMISSIONS = '@SkipPermission';
const SKIP_LOGIN_KEY = '@skipLogin';
const ALREADY_LAUNCHED_KEY = '@alreadyLaunched';
const REGION_ID_KEY = '@RegionId';

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
  storage.delete(AUTH_DATA_KEY);
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
  storage.delete(SKIP_PERMISSIONS);
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
  storage.delete(NEW_USER_key);
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
  storage.delete(ALREADY_LAUNCHED_KEY);
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
  storage.delete(REGION_ID_KEY);
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
    storage.delete(key);
  },
};
