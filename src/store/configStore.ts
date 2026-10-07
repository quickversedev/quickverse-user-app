import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchInitialConfig } from '../services/api/configService';
import { setRegionId, getRegionId } from '../services/localStorage/storage.service';
import { InitialConfigParams, InitialConfigResponse } from '../types/config';
import { CACHE_TTL, createPersistedConfig, isCacheFresh } from '../utils/cache';

interface ConfigStore {
  config: InitialConfigResponse | null;
  loading: boolean;
  error: string | null;
  _lastFetchedAt: number;

  fetchInitialConfig: (params: InitialConfigParams) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  invalidateCache: () => void;
  reset: () => void;
  /** The region, refetched once for the same place if the cached config has none. */
  ensureRegionId: () => Promise<string | null>;

  getConfig: () => InitialConfigResponse | null;
  getDeliveryDistance: () => number | null;
  getThemeId: () => string | null;
  getRegionId: () => string | null;
  getStoredRegionId: () => string | undefined;
  getDefaultLocation: () => { latitude: string; longitude: string } | null;
  defaultThemeEnabled: () => boolean;
  hasConfig: () => boolean;
}

const initialState = {
  config: null as InitialConfigResponse | null,
  loading: false,
  error: null as string | null,
  _lastFetchedAt: 0,
};

const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchInitialConfig: async (params: InitialConfigParams) => {
        // A config without a region is never "fresh": the server returned no region for a town
        // whose settings were missing (Gevrai, Oct 2026), and caching that for the TTL left
        // every per-region request — coupons, posters — without one for hours.
        if (
          isCacheFresh(get()._lastFetchedAt, CACHE_TTL.CONFIG) &&
          get().config &&
          get().config?.regionId
        ) {
          return;
        }

        set({ loading: true, error: null });

        try {
          const config = await fetchInitialConfig(params);
          if (config?.regionId) {
            setRegionId(config.regionId);
          }
          set({
            config,
            loading: false,
            error: null,
            _lastFetchedAt: Date.now(),
          });
        } catch (err: unknown) {
          set({
            loading: false,
            error: (err as Error)?.message || 'Failed to fetch initial configuration',
          });
        }
      },

      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      invalidateCache: () => set({ _lastFetchedAt: 0 }),
      reset: () => set(initialState),

      ensureRegionId: async () => {
        const current = get().config?.regionId;
        if (current) return current;
        // Asked again for the place the config was fetched for (the server echoes it back).
        const location = get().config?.defaultLocation;
        if (!location) return null;
        set({ _lastFetchedAt: 0 });
        await get().fetchInitialConfig({
          latitude: String(location.latitude),
          longitude: String(location.longitude),
        });
        return get().config?.regionId || null;
      },

      getConfig: () => get().config,
      getDeliveryDistance: () => get().config?.deliveryDistance || null,
      getThemeId: () => get().config?.themeId || null,
      getRegionId: () => get().config?.regionId || null,
      getStoredRegionId: () => getRegionId(),
      getDefaultLocation: () => get().config?.defaultLocation || null,
      defaultThemeEnabled: () => get().config?.defaultThemeEnabled || false,
      hasConfig: () => get().config !== null,
    }),
    createPersistedConfig<ConfigStore>('config-storage', state => ({
      config: state.config,
      _lastFetchedAt: state._lastFetchedAt,
    }))
  )
);

export default useConfigStore;
