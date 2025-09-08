import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseAppStateRefreshOptions {
  onForeground?: () => void | Promise<void>;
  onBackground?: () => void;
  refreshThreshold?: number; // Minimum time in background before triggering refresh (in milliseconds)
  enabled?: boolean;
}

export const useAppStateRefresh = (options: UseAppStateRefreshOptions = {}) => {
  const {
    onForeground,
    onBackground,
    refreshThreshold = 30000, // 30 seconds default
    enabled = true,
  } = options;

  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      if (!enabled || !isMountedRef.current) return;

      const currentTime = Date.now();

      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        const timeInBackground = backgroundTimeRef.current
          ? currentTime - backgroundTimeRef.current
          : 0;
        // Only trigger refresh if app was in background for longer than threshold
        if (timeInBackground >= refreshThreshold) {
          try {
            if (onForeground) {
              await onForeground();
            }
          } catch (error) {
            console.warn('Error during foreground refresh:', error);
          }
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to background
        backgroundTimeRef.current = currentTime;

        if (onBackground) {
          try {
            onBackground();
          } catch (error) {
            console.warn('Error during background cleanup:', error);
          }
        }
      }

      appStateRef.current = nextAppState;
    },
    [onForeground, onBackground, refreshThreshold, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [handleAppStateChange, enabled]);

  // Return a manual refresh function
  const manualRefresh = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    try {
      if (onForeground) {
        await onForeground();
      }
    } catch (error) {
      console.warn('Error during manual refresh:', error);
    }
  }, [onForeground, enabled]);

  return {
    manualRefresh,
    isInBackground: appStateRef.current.match(/inactive|background/) !== null,
  };
};
