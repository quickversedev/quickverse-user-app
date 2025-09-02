import { create } from 'zustand';
import { fetchInitialConfig } from '../services/api/configService';
import { getRegionId, setRegionId } from '../services/localStorage/storage.service';
import { InitialConfigParams, InitialConfigResponse } from '../types/config';

interface ConfigStore {
  // State
  config: InitialConfigResponse | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchInitialConfig: (params: InitialConfigParams) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;

  // Getters
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
  config: null,
  loading: false,
  error: null,
};

const useConfigStore = create<ConfigStore>((set, get) => ({
  ...initialState,

  /**
   * Fetches initial configuration from API based on location coordinates
   * @param params - Object containing longitude and latitude
   */
  fetchInitialConfig: async (params: InitialConfigParams) => {
    set({ loading: true, error: null });

    try {
      const config = await fetchInitialConfig(params);
      // Store RegionId in MMKV storage when config is fetched
      if (config?.regionId) {
        setRegionId(config.regionId);
      }
      console.log('config', config);
      set({
        config,
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      set({
        config: null,
        loading: false,
        error: (err as Error)?.message || 'Failed to fetch initial configuration',
      });
    }
  },

  /**
   * Manually set loading state
   */
  setLoading: (loading: boolean) => {
    set({ loading });
  },

  /**
   * Manually set error state
   */
  setError: (error: string | null) => {
    set({ error });
  },

  /**
   * Clear the current error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  },

  /**
   * Get the current configuration
   */
  getConfig: () => get().config,

  /**
   * Get the delivery distance from configuration
   */
  getDeliveryDistance: () => get().config?.deliveryDistance || null,

  /**
   * Get the theme ID from configuration
   */
  getThemeId: () => get().config?.themeId || null,

  /**
   * Get the region ID from configuration
   */
  getRegionId: () => get().config?.regionId || null,

  /**
   * Get the stored region ID from MMKV storage
   */
  getStoredRegionId: () => getRegionId(),

  /**
   * Get the default location from configuration
   */
  getDefaultLocation: () => get().config?.defaultLocation || null,

  /**
   * Check if default theme is enabled
   */
  defaultThemeEnabled: () => get().config?.defaultThemeEnabled || false,

  /**
   * Check if configuration exists
   */
  hasConfig: () => get().config !== null,
}));

export default useConfigStore;
