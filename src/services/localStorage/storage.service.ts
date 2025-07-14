// src/services/storage.service.ts
import { MMKV } from 'react-native-mmkv';

// Initialize MMKV
export const storage = new MMKV();
const AUTH_DATA_KEY = '@AuthData';
const NEW_USER_key = '@NewUser';
const SKIP_PERMISSIONS = '@SkipPermission';
const SKIP_LOGIN_KEY = '@skipLogin';
const ALREADY_LAUNCHED_KEY = '@alreadyLaunched';

export const setSkipLoginFlow = (skipLogin: boolean): void => {
  storage.set(SKIP_LOGIN_KEY, skipLogin);
};

export const getSkipLoginFlow = (): boolean | undefined => {
  return storage.getBoolean(SKIP_LOGIN_KEY);
};

/**
 * Sets auth token string in storage
 * @param token string
 */
export const setAuthToken = (token: string): void => {
  storage.set(AUTH_DATA_KEY, token);
};

/**
 * Gets auth token string from storage
 * @returns string | undefined
 */
export const getAuthToken = (): string | undefined => {
  return storage.getString(AUTH_DATA_KEY) ?? undefined;
};

/**
 * Removes auth token from storage
 */
export const removeAuthToken = (): void => {
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
