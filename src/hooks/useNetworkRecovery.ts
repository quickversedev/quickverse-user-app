import { useCallback, useEffect, useRef, useState } from 'react';

let NetInfo: typeof import('@react-native-community/netinfo').default | null = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch {
  // no-op until native rebuild
}

interface UseNetworkRecoveryOptions {
  onReconnect: () => void | Promise<void>;
  enabled?: boolean;
  debounceMs?: number;
}

export const useNetworkRecovery = (options: UseNetworkRecoveryOptions) => {
  const { onReconnect, enabled = true, debounceMs = 2000 } = options;

  const [isConnected, setIsConnected] = useState(true);
  const wasDisconnectedRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleNetworkChange = useCallback(
    (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
      if (!enabled || !isMountedRef.current) return;

      const connected = state.isConnected && state.isInternetReachable !== false;

      setIsConnected(!!connected);

      if (!connected) {
        wasDisconnectedRef.current = true;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        return;
      }

      if (connected && wasDisconnectedRef.current) {
        wasDisconnectedRef.current = false;
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(async () => {
          if (!isMountedRef.current) return;
          try {
            await onReconnect();
          } catch (err) {
            console.warn('Network recovery refresh failed:', err);
          }
        }, debounceMs);
      }
    },
    [enabled, onReconnect, debounceMs],
  );

  const manualRetry = useCallback(async () => {
    try {
      await onReconnect();
    } catch (err) {
      console.warn('Manual network retry failed:', err);
    }
  }, [onReconnect]);

  useEffect(() => {
    if (!enabled || !NetInfo) return;
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);
    return () => unsubscribe();
  }, [handleNetworkChange, enabled]);

  return { isConnected, manualRetry };
};
