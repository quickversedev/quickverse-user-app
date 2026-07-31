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
        if (isCacheFresh(get()._lastFetchedAt, CACHE_TTL.CONFIG) && get().config) {
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
