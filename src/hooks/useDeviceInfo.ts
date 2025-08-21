import { useCallback } from 'react';
import { useAuth } from '../contexts/login/AuthProvider';
import deviceInfoService from '../services/deviceInfoService';
import { useNotifications } from './useNotifications';

export const useDeviceInfo = () => {
  const { authData } = useAuth();
  const { getFCMToken } = useNotifications();

  /**
   * Update device information to backend
   */
  const updateDeviceInfo = useCallback(
    async (longitude?: number, latitude?: number) => {
      try {
        if (!authData?.jwt) {
          console.warn('No auth token available for device info update');
          return null;
        }

        const fcmToken = await getFCMToken();
        if (!fcmToken) {
          console.warn('No FCM token available for device info update');
          return null;
        }

        const response = await deviceInfoService.updateDeviceInfo(
          authData.jwt,
          fcmToken,
          longitude,
          latitude
        );

        console.log('Device info updated successfully:', response);
        return response;
      } catch (error) {
        console.error('Failed to update device info:', error);
        throw error;
      }
    },
    [authData?.jwt, getFCMToken]
  );

  /**
   * Get device info for logging/debugging
   */
  const getDeviceInfoForLogging = useCallback(async () => {
    try {
      const deviceInfo = await deviceInfoService.getDeviceInfoForLogging();
      console.log('Device Info:', deviceInfo);
      return deviceInfo;
    } catch (error) {
      console.error('Failed to get device info for logging:', error);
      return null;
    }
  }, []);

  return {
    updateDeviceInfo,
    getDeviceInfoForLogging,
  };
};
