import { useAuth } from '../contexts/login/AuthProvider';
import { useLocation } from '../hooks/Permissions/useLocation';
import { useNotifications } from '../hooks/useNotifications';
import deviceInfoService from '../services/deviceInfoService';

/**
 * Update device info after successful login
 * This should be called after user authentication is complete
 */
export const updateDeviceInfoAfterLogin = async (
  sessionKey: string,
  fcmToken: string,
  longitude: number,
  latitude: number
) => {
  try {
    const response = await deviceInfoService.updateDeviceInfo(
      sessionKey,
      fcmToken,
      longitude,
      latitude
    );
    return response;
  } catch (error) {
    // Don't throw error to avoid blocking login flow
    return null;
  }
};

/**
 * Update device info when app comes to foreground
 * This should be called when app state changes to active
 */
export const updateDeviceInfoOnForeground = async (
  sessionKey: string,
  fcmToken: string,
  longitude: number,
  latitude: number
) => {
  try {
    const response = await deviceInfoService.updateDeviceInfo(
      sessionKey,
      fcmToken,
      longitude,
      latitude
    );
    return response;
  } catch (error) {
    return null;
  }
};

/**
 * Update device info when FCM token refreshes
 * This should be called when FCM token is refreshed
 */
export const updateDeviceInfoOnTokenRefresh = async (
  sessionKey: string,
  newFcmToken: string,
  longitude: number,
  latitude: number
) => {
  try {
    const response = await deviceInfoService.updateDeviceInfo(
      sessionKey,
      newFcmToken,
      longitude,
      latitude
    );
    return response;
  } catch (error) {
    return null;
  }
};

/**
 * Hook to get device info update functions with current auth and location context
 */
export const useDeviceInfoUpdates = () => {
  const { authData } = useAuth();
  const { getFCMToken } = useNotifications();
  const { getCurrentLocation } = useLocation();

  const updateDeviceInfo = async () => {
    try {
      if (!authData?.jwt) {
        return null;
      }

      const fcmToken = await getFCMToken();
      if (!fcmToken) {
        return null;
      }

      const location = await getCurrentLocation();
      if (!location) {
        return null;
      }

      const response = await updateDeviceInfoAfterLogin(
        authData.jwt,
        fcmToken,
        location.longitude,
        location.latitude
      );

      return response;
    } catch (error) {
      return null;
    }
  };

  return {
    updateDeviceInfo,
  };
};
