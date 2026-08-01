import { createJSONStorage, StateStorage } from 'zustand/middleware';
import { mmkvStorage } from '../services/localStorage/storage.service';

export const CACHE_TTL = {
  CONFIG: 4 * 60 * 60 * 1000,
  THEME: 4 * 60 * 60 * 1000,
  PRICING: 4 * 60 * 60 * 1000,
  PAGES: 30 * 60 * 1000,
  VENDORS: 10 * 60 * 1000,
} as const;

export function isCacheFresh(lastFetchedAt: number, ttlMs: number): boolean {
  return lastFetchedAt > 0 && Date.now() - lastFetchedAt < ttlMs;
}

export function createPersistedConfig<T>(key: string, partializeFn: (state: T) => Partial<T>) {
  return {
    name: key,
    storage: createJSONStorage(() => mmkvStorage as StateStorage),
    partialize: partializeFn,
  };
}
