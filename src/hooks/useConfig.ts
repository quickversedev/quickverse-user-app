import { useCallback } from 'react';
import useConfigStore from '../store/configStore';
import { InitialConfigParams } from '../types/config';

/**
 * Custom hook for managing initial configuration state
 * Provides a clean interface to the config store with automatic error handling
 */
export const useConfig = () => {
  const {
    config,
    loading,
    error,
    fetchInitialConfig: fetchConfig,
    setLoading,
    setError,
    clearError,
    reset,
    getConfig,
    getThemeId,
    getRegionId,
    getDefaultLocation,
    hasConfig,
  } = useConfigStore();

  /**
   * Fetch initial configuration with error handling
   */
  const fetchInitialConfig = useCallback(
    async (params: InitialConfigParams) => {
      try {
        await fetchConfig(params);
      } catch (err) {
        console.error('Failed to fetch initial config:', err);
      }
    },
    [fetchConfig]
  );

  /**
   * Retry the last failed request
   */
  const retryFetch = useCallback(
    async (params: InitialConfigParams) => {
      clearError();
      await fetchInitialConfig(params);
    },
    [clearError, fetchInitialConfig]
  );

  return {
    // State
    config,
    loading,
    error,

    // Actions
    fetchInitialConfig,
    retryFetch,
    setLoading,
    setError,
    clearError,
    reset,

    // Getters
    getConfig,
    getThemeId,
    getRegionId,
    getDefaultLocation,
    hasConfig,
  };
};
